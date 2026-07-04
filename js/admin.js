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
const ADMIN_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";

if (!token || (storedUser?.role !== "admin" && decodedUser?.role !== "admin")) {
  window.location.href = "login.html";
}

const ADMIN_API = `${ADMIN_API_ORIGIN}/api/admin`;
const REVIEWS_API = `${ADMIN_API_ORIGIN}/api/reviews`;
const designList = document.getElementById("designList");
const bookingList = document.getElementById("bookingList");
const inquiryList = document.getElementById("inquiryList");
const feedbackList = document.getElementById("feedbackList");
const designForm = document.getElementById("designForm");
const sectionHeading = document.getElementById("sectionHeading");
const statusMessage = document.getElementById("statusMessage");
const formHeading = document.getElementById("formHeading");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const createDesignBtn = document.getElementById("createDesignBtn");
const refreshBookingsBtn = document.getElementById("refreshBookingsBtn");
const refreshInquiriesBtn = document.getElementById("refreshInquiriesBtn");
const refreshFeedbackBtn = document.getElementById("refreshFeedbackBtn");
const resetFormBtn = document.getElementById("resetFormBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminBadge = document.getElementById("adminBadge");
const submitDesignBtn = document.getElementById("submitDesignBtn");
const adminFallbackImages = {
  residential: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
  bedroom: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  bathroom: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
  design: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80"
};

function getAdminFallbackImage(category) {
  return adminFallbackImages[String(category || "design").toLowerCase()] || adminFallbackImages.design;
}

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
  bookings: [],
  inquiries: [],
  feedback: [],
  editingDesignId: null,
  catalogIdentity: ""
};

function normalizeCatalogDesign(design) {
  const resolvedMedia = typeof window.resolveDesignMedia === "function"
    ? window.resolveDesignMedia(design)
    : null;
  const fallbackImage = getAdminFallbackImage((resolvedMedia && resolvedMedia.mediaCategory) || design.category);
  return {
    ...design,
    image: (resolvedMedia && resolvedMedia.image) || design.image || design.heroImage || fallbackImage,
    heroImage: (resolvedMedia && resolvedMedia.heroImage) || design.heroImage || design.image || fallbackImage,
    gallery: resolvedMedia?.gallery || (Array.isArray(design.gallery) && design.gallery.length ? design.gallery : [design.image || design.heroImage || fallbackImage]),
    mediaCategory: (resolvedMedia && resolvedMedia.mediaCategory) || design.category,
    catalogIdentity: design.catalogIdentity || getCatalogDesignIdentity(design),
    fromApi: Boolean(design.fromApi),
    fromCatalog: Boolean(design.fromCatalog)
  };
}

function getCatalogDesignIdentity(design) {
  return `${String(design.title || "").trim().toLowerCase()}::${String(design.category || "").trim().toLowerCase()}`;
}

function mergeDesignSources(apiDesigns = [], catalogDesigns = []) {
  const merged = new Map();

  catalogDesigns.forEach((design) => {
    const normalized = normalizeCatalogDesign({
      ...design,
      fromCatalog: true,
      fromApi: false
    });
    const key = `${normalized.title}::${normalized.category}`;
    merged.set(key, normalized);
  });

  apiDesigns.forEach((design) => {
    const normalized = normalizeCatalogDesign({
      ...design,
      fromCatalog: false,
      fromApi: true
    });
    const key = normalized.catalogIdentity || getCatalogDesignIdentity(normalized);
    merged.set(key, normalized);
  });

  return Array.from(merged.values());
}

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

function resolveAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  if (raw.startsWith("/")) {
    return `${ADMIN_API_ORIGIN}${raw}`;
  }
  return raw;
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
    bookings: "Review Appointment Bookings",
    inquiries: "Review Client Inquiries",
    feedback: "Review User Feedback"
  };

  sectionHeading.textContent = sectionTitles[id] || "Admin Dashboard";
}

function resetForm() {
  designForm.reset();
  state.editingDesignId = null;
  state.catalogIdentity = "";
  formHeading.textContent = "Add New Design";
  submitDesignBtn.textContent = "Save Design";
  cancelEditBtn.hidden = true;
}

function fillForm(design) {
  state.editingDesignId = design.fromApi ? design.id : null;
  state.catalogIdentity = design.catalogIdentity || getCatalogDesignIdentity(design);
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
  formHeading.textContent = design.fromApi ? `Edit: ${design.title}` : `Add Catalog Design: ${design.title}`;
  submitDesignBtn.textContent = design.fromApi ? "Update Design" : "Save Design";
  cancelEditBtn.hidden = false;
  showSection("editor");
}

function createDesignCard(design) {
  const article = document.createElement("article");
  article.className = "card";
  const editLabel = "Edit";
  const deleteButton = '<button type="button" class="danger-btn" data-action="delete">Delete</button>';
  article.innerHTML = `
    <img src="${design.image || design.heroImage || getAdminFallbackImage(design.mediaCategory || design.category)}" alt="${design.title}" data-fallback-image="${getAdminFallbackImage(design.mediaCategory || design.category)}">
    <div class="card-body">
      <div class="card-top">
        <div>
          <p class="card-meta">${design.style || "Signature Luxe"}</p>
          <h4>${design.title}</h4>
        </div>
        <span class="card-tag">${design.category || "design"}</span>
      </div>
      <p>${design.description || "No description added yet."}</p>
      <p class="card-meta">${design.fromApi ? "Stored in admin database and live on the website" : "Website catalog design. Edit to publish changes from admin."}</p>
      <div class="card-actions">
        <button type="button" class="secondary-btn" data-action="edit">${editLabel}</button>
        ${deleteButton}
      </div>
    </div>
  `;

  article.querySelector("img")?.addEventListener("error", (event) => {
    event.currentTarget.src = event.currentTarget.dataset.fallbackImage || getAdminFallbackImage(design.mediaCategory || design.category);
  }, { once: true });
  article.querySelector('[data-action="edit"]').addEventListener("click", () => fillForm(design));
  article.querySelector('[data-action="delete"]')?.addEventListener("click", () => deleteDesign(design));
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

function renderBookings() {
  bookingList.innerHTML = "";

  if (!state.bookings.length) {
    bookingList.innerHTML = '<p class="empty-state">No bookings have been submitted yet.</p>';
    return;
  }

  state.bookings.forEach((booking) => {
    const bookingImages = String(booking.roomImages || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const bookingImagesMarkup = bookingImages.length
      ? `
        <div class="booking-image-grid">
          ${bookingImages.map((image, index) => `<img src="${resolveAssetUrl(image)}" alt="${booking.name || "Booking"} room image ${index + 1}" class="booking-image-thumb">`).join("")}
        </div>
      `
      : `<p><strong>Room Images:</strong> Not uploaded</p>`;
    const article = document.createElement("article");
    article.className = "inquiry-card";
    article.innerHTML = `
      <div class="inquiry-head">
        <div>
          <h4>${booking.name || "Guest"}</h4>
          <p class="inquiry-meta">${booking.email || "No email"}${booking.timeSlot ? ` | ${booking.timeSlot}` : ""}</p>
        </div>
        <span class="card-tag">${booking.projectType || "Consultation"}</span>
      </div>
      <p><strong>Date:</strong> ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : "Not selected"}</p>
      <p><strong>Budget:</strong> ${booking.budget || "Not shared"}</p>
      ${bookingImagesMarkup}
      <p>${booking.requirements || "No extra requirements shared."}</p>
      <p class="inquiry-meta">${new Date(booking.createdAt).toLocaleString()}</p>
    `;
    article.querySelectorAll(".booking-image-thumb").forEach((image) => {
      image.addEventListener("error", () => {
        image.style.display = "none";
      }, { once: true });
    });
    bookingList.appendChild(article);
  });
}

function renderFeedback() {
  feedbackList.innerHTML = "";

  if (!state.feedback.length) {
    feedbackList.innerHTML = '<p class="empty-state">No feedback has been submitted yet.</p>';
    return;
  }

  state.feedback.forEach((item) => {
    const article = document.createElement("article");
    article.className = "inquiry-card";
    article.innerHTML = `
      <div class="inquiry-head">
        <div>
          <h4>${item.name || "Anonymous"}</h4>
          <p class="inquiry-meta">${item.email || "No email"}${item.page ? ` | ${item.page}` : ""}</p>
        </div>
        <span class="card-tag">${item.rating}/5</span>
      </div>
      <p>${item.comment || ""}</p>
      <p class="inquiry-meta">${new Date(item.createdAt).toLocaleString()}</p>
    `;
    feedbackList.appendChild(article);
  });
}

async function loadDesigns() {
  const response = await fetch(`${ADMIN_API}/designs`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to load designs.");
  }

  const apiDesigns = await response.json();
  const catalogDesigns = Array.isArray(window.DESIGN_LIBRARY) ? window.DESIGN_LIBRARY : [];
  state.designs = mergeDesignSources(apiDesigns, catalogDesigns);
  renderDesigns();
}

async function loadBookings() {
  const response = await fetch(`${ADMIN_API}/bookings`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to load bookings.");
  }

  state.bookings = await response.json();
  renderBookings();
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

async function loadFeedback() {
  let response = await fetch(`${ADMIN_API}/feedback`, {
    headers: getAuthHeaders()
  });

  if (response.status === 404) {
    response = await fetch(REVIEWS_API);
  }

  if (!response.ok) {
    throw new Error("Unable to load feedback.");
  }

  state.feedback = await response.json();
  renderFeedback();
}

async function deleteDesign(design) {
  if (!window.confirm("Delete this design permanently?")) {
    return;
  }

  const response = design.fromApi
    ? await fetch(`${ADMIN_API}/design/${design.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      })
    : await fetch(`${ADMIN_API}/design/hide-catalog`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: design.title,
          category: design.category,
          catalogIdentity: design.catalogIdentity || getCatalogDesignIdentity(design)
        })
      });

  if (!response.ok) {
    throw new Error("Unable to delete this design.");
  }

  setStatus(design.fromApi ? "Design deleted successfully." : "Design removed from the website successfully.");
  await loadDesigns();
}

async function submitDesignForm(event) {
  event.preventDefault();

  const formData = new FormData(designForm);
  if (state.catalogIdentity) {
    formData.set("catalogIdentity", state.catalogIdentity);
  }
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
refreshBookingsBtn?.addEventListener("click", async () => {
  try {
    await loadBookings();
    setStatus("Bookings refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});
refreshInquiriesBtn?.addEventListener("click", async () => {
  try {
    await loadInquiries();
    setStatus("Inquiries refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});
refreshFeedbackBtn?.addEventListener("click", async () => {
  try {
    await loadFeedback();
    setStatus("Feedback refreshed.");
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
    await Promise.all([loadDesigns(), loadBookings(), loadInquiries(), loadFeedback()]);
    setStatus("Dashboard loaded.");
  } catch (error) {
    setStatus(error.message || "Unable to load dashboard.", true);
  }
})();
