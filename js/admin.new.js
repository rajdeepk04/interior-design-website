const token = localStorage.getItem("luxeAuthToken");
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("luxeUser") || "null");
  } catch (_error) {
    return null;
  }
})();

function parseJwt(value) {
  try {
    return JSON.parse(atob(value.split(".")[1]));
  } catch (_error) {
    return null;
  }
}

const decodedUser = token ? parseJwt(token) : null;

if (!token || (storedUser?.role !== "admin" && decodedUser?.role !== "admin")) {
  window.location.href = "login.html";
}

const ADMIN_API = "/api/admin";
const designList = document.getElementById("designList");
const inquiryList = document.getElementById("inquiryList");
const designForm = document.getElementById("designForm");
const sectionHeading = document.getElementById("sectionHeading");
const statusMessage = document.getElementById("statusMessage");
const formHeading = document.getElementById("formHeading");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const createDesignBtn = document.getElementById("createDesignBtn");
const refreshInquiriesBtn = document.getElementById("refreshInquiriesBtn");
const resetFormBtn = document.getElementById("resetFormBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminBadge = document.getElementById("adminBadge");
const submitDesignBtn = document.getElementById("submitDesignBtn");

const formFields = {
  title: document.getElementById("title"),
  category: document.getElementById("category"),
  style: document.getElementById("style"),
  area: document.getElementById("area"),
  timeline: document.getElementById("timeline"),
  year: document.getElementById("year"),
  image: document.getElementById("image"),
  heroImage: document.getElementById("heroImage"),
  gallery: document.getElementById("gallery"),
  description: document.getElementById("description"),
  longDescription: document.getElementById("longDescription")
};

const state = {
  designs: [],
  inquiries: [],
  editingDesignId: null
};

if (adminBadge) {
  adminBadge.textContent = `Signed in as ${storedUser?.name || storedUser?.email || "Admin"}`;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.background = isError ? "rgba(162, 59, 46, 0.14)" : "rgba(182, 139, 61, 0.16)";
  statusMessage.style.color = isError ? "#8b2f24" : "#6c3f24";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${token}`
  };
}

function showSection(id) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });

  document.querySelectorAll("[data-section-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sectionTarget === id);
  });

  const sectionTitles = {
    designs: "Manage All Designs",
    editor: state.editingDesignId ? "Update Design" : "Add New Design",
    inquiries: "Review Client Inquiries"
  };

  sectionHeading.textContent = sectionTitles[id] || "Admin Dashboard";
}

function resetForm() {
  designForm.reset();
  state.editingDesignId = null;
  formHeading.textContent = "Add New Design";
  submitDesignBtn.textContent = "Save Design";
  cancelEditBtn.hidden = true;
}

function fillForm(design) {
  state.editingDesignId = design.id;
  formFields.title.value = design.title || "";
  formFields.category.value = design.category || "residential";
  formFields.style.value = design.style || "";
  formFields.area.value = design.area || "";
  formFields.timeline.value = design.timeline || "";
  formFields.year.value = design.year || "";
  formFields.image.value = design.image || "";
  formFields.heroImage.value = design.heroImage || "";
  formFields.gallery.value = (design.gallery || []).join(", ");
  formFields.description.value = design.description || "";
  formFields.longDescription.value = design.longDescription || "";
  formHeading.textContent = `Edit: ${design.title}`;
  submitDesignBtn.textContent = "Update Design";
  cancelEditBtn.hidden = false;
  showSection("editor");
}

function createDesignCard(design) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <img src="${design.image || design.heroImage || ""}" alt="${design.title}">
    <div class="card-body">
      <div class="card-top">
        <div>
          <p class="card-meta">${design.style || "Signature Luxe"}</p>
          <h4>${design.title}</h4>
        </div>
        <span class="card-tag">${design.category || "design"}</span>
      </div>
      <p>${design.description || "No description added yet."}</p>
      <div class="card-actions">
        <button type="button" class="secondary-btn" data-action="edit">Edit</button>
        <button type="button" class="danger-btn" data-action="delete">Delete</button>
      </div>
    </div>
  `;

  article.querySelector('[data-action="edit"]').addEventListener("click", () => fillForm(design));
  article.querySelector('[data-action="delete"]').addEventListener("click", () => deleteDesign(design.id));
  return article;
}

function renderDesigns() {
  designList.innerHTML = "";

  if (!state.designs.length) {
    designList.innerHTML = '<p class="empty-state">No designs available yet.</p>';
    return;
  }

  state.designs.forEach((design) => {
    designList.appendChild(createDesignCard(design));
  });
}

function renderInquiries() {
  inquiryList.innerHTML = "";

  if (!state.inquiries.length) {
    inquiryList.innerHTML = '<p class="empty-state">No inquiries have been received yet.</p>';
    return;
  }

  state.inquiries.forEach((inquiry) => {
    const article = document.createElement("article");
    article.className = "inquiry-card";
    article.innerHTML = `
      <div class="inquiry-head">
        <div>
          <h4>${inquiry.name || "Guest"}</h4>
          <p class="inquiry-meta">${inquiry.email || "No email"}${inquiry.phone ? ` | ${inquiry.phone}` : ""}</p>
        </div>
        <span class="card-tag">${inquiry.subject || "General inquiry"}</span>
      </div>
      <p>${inquiry.message || ""}</p>
      <p class="inquiry-meta">${new Date(inquiry.createdAt).toLocaleString()}</p>
    `;
    inquiryList.appendChild(article);
  });
}

async function loadDesigns() {
  const response = await fetch(`${ADMIN_API}/designs`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to load designs.");
  }

  state.designs = await response.json();
  renderDesigns();
}

async function loadInquiries() {
  const response = await fetch(`${ADMIN_API}/inquiries`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to load inquiries.");
  }

  state.inquiries = await response.json();
  renderInquiries();
}

async function deleteDesign(id) {
  if (!window.confirm("Delete this design permanently?")) {
    return;
  }

  const response = await fetch(`${ADMIN_API}/design/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to delete this design.");
  }

  setStatus("Design deleted successfully.");
  await loadDesigns();
}

async function submitDesignForm(event) {
  event.preventDefault();

  const formData = new FormData(designForm);
  const endpoint = state.editingDesignId
    ? `${ADMIN_API}/design/${state.editingDesignId}`
    : `${ADMIN_API}/design`;
  const method = state.editingDesignId ? "PUT" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: getAuthHeaders(),
    body: formData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to save design.");
  }

  setStatus(state.editingDesignId ? "Design updated successfully." : "Design added successfully.");
  resetForm();
  showSection("designs");
  await loadDesigns();
}

function logout() {
  localStorage.removeItem("luxeAuthToken");
  localStorage.removeItem("luxeUser");
  window.location.href = "login.html";
}

document.querySelectorAll("[data-section-target]").forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.sectionTarget));
});

createDesignBtn?.addEventListener("click", () => {
  resetForm();
  showSection("editor");
});

cancelEditBtn?.addEventListener("click", () => {
  resetForm();
  showSection("designs");
});

resetFormBtn?.addEventListener("click", resetForm);
logoutBtn?.addEventListener("click", logout);
refreshInquiriesBtn?.addEventListener("click", async () => {
  try {
    await loadInquiries();
    setStatus("Inquiries refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});
designForm?.addEventListener("submit", async (event) => {
  try {
    await submitDesignForm(event);
  } catch (error) {
    setStatus(error.message, true);
  }
});

(async function initializeAdmin() {
  try {
    await Promise.all([loadDesigns(), loadInquiries()]);
    setStatus("Dashboard loaded.");
  } catch (error) {
    setStatus(error.message || "Unable to load dashboard.", true);
  }
})();
