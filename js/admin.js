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

const adminAvatarEl = document.getElementById("adminAvatar");
if (adminAvatarEl) {
  adminAvatarEl.src = resolveAssetUrl(storedUser?.avatar || storedUser?.picture) || getAdminFallbackImage();
}

const avatarIllustrationEl = document.getElementById('avatarIllustration');

function updateAvatarIllustrationVisibility() {
  if (!avatarIllustrationEl || !adminAvatarEl) return;
  const hasCustom = Boolean(storedUser?.avatar) || String(adminAvatarEl.src || "").startsWith('data:');
  avatarIllustrationEl.style.display = hasCustom ? 'none' : 'flex';
}

updateAvatarIllustrationVisibility();

// Avatar upload flow
const adminAvatarFileInput = document.getElementById("adminAvatarFile");
if (adminAvatarEl && adminAvatarFileInput) {
  adminAvatarEl.style.cursor = "pointer";
  adminAvatarEl.title = "Click to change avatar";
  adminAvatarEl.addEventListener("click", () => adminAvatarFileInput.click());

  adminAvatarFileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Resize + crop to 256x256 before upload
    setStatus("Preparing avatar...");
    try {
      const blob = await resizeAndCropImage(file, 256);

      // show preview
      const reader = new FileReader();
      reader.onload = () => {
        adminAvatarEl.src = reader.result;
        updateAvatarIllustrationVisibility();
      };
      reader.readAsDataURL(blob);

      const fd = new FormData();
      fd.append("avatar", blob, "avatar.jpg");

      setStatus("Uploading avatar...");

      const res = await fetch(`${ADMIN_API}/avatar`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");
      adminAvatarEl.src = resolveAssetUrl(data.avatar);
      updateAvatarIllustrationVisibility();
      setStatus("Avatar updated.");
    } catch (err) {
      setStatus(err.message || "Avatar upload failed.", true);
    }
  });
}

// Set avatar via URL (button)
const setAvatarUrlBtn = document.getElementById('setAvatarUrlBtn');
if (setAvatarUrlBtn) {
  setAvatarUrlBtn.addEventListener('click', async () => {
    const url = window.prompt('Enter an image URL (https://...) or a /uploads/... path:');
    if (!url) return;
    setStatus('Updating avatar...');
    try {
      const res = await fetch(`${ADMIN_API}/avatar/url`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: url.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Unable to set avatar');
      adminAvatarEl.src = resolveAssetUrl(data.avatar);
      // update localStorage luxeUser if present
      try {
        const current = JSON.parse(localStorage.getItem('luxeUser') || 'null') || {};
        current.avatar = data.avatar;
        localStorage.setItem('luxeUser', JSON.stringify(current));
      } catch (_e) {}
      updateAvatarIllustrationVisibility();
      setStatus('Avatar updated.');
    } catch (err) {
      setStatus(err.message || 'Failed to update avatar', true);
    }
  });
}

/* Avatar cropping modal wiring */
const cropModal = document.getElementById("cropModal");
const cropBackdrop = document.getElementById("cropBackdrop");
const cropCloseBtn = document.getElementById("cropCloseBtn");
const cropCancelBtn = document.getElementById("cropCancelBtn");
const cropApplyBtn = document.getElementById("cropApplyBtn");
const cropCanvas = document.getElementById("cropCanvas");
const cropZoom = document.getElementById("cropZoom");

let cropImg = new Image();
let cropState = {scale:1, x:0, y:0, dragging:false, startX:0, startY:0};

function openCropModalWithFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      cropImg = new Image();
      cropImg.onload = () => {
        cropState = {scale:1, x:0, y:0, dragging:false, startX:0, startY:0};
        cropZoom.value = 1;
        showCropModal(true);
        drawCrop();
        resolve();
      };
      cropImg.onerror = reject;
      cropImg.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showCropModal(open = true) {
  if (!cropModal) return;
  cropModal.setAttribute('data-open', open ? 'true' : 'false');
  cropModal.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function drawCrop() {
  if (!cropCanvas || !cropImg) return;
  const ctx = cropCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = cropCanvas.clientWidth;
  const h = cropCanvas.clientHeight;
  cropCanvas.width = Math.floor(w * dpr);
  cropCanvas.height = Math.floor(h * dpr);
  ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);

  const scale = parseFloat(cropZoom.value || 1) * cropState.scale;
  const iw = cropImg.width * scale;
  const ih = cropImg.height * scale;

  const cx = (cropCanvas.width - iw) / 2 + (cropState.x * dpr);
  const cy = (cropCanvas.height - ih) / 2 + (cropState.y * dpr);

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cropImg, 0, 0, cropImg.width, cropImg.height, cx, cy, iw, ih);
}

// pointer interactions
if (cropCanvas) {
  cropCanvas.addEventListener('pointerdown', (ev) => {
    cropState.dragging = true;
    cropState.startX = ev.clientX;
    cropState.startY = ev.clientY;
    cropCanvas.setPointerCapture(ev.pointerId);
  });
  cropCanvas.addEventListener('pointermove', (ev) => {
    if (!cropState.dragging) return;
    const dx = ev.clientX - cropState.startX;
    const dy = ev.clientY - cropState.startY;
    cropState.startX = ev.clientX;
    cropState.startY = ev.clientY;
    cropState.x += dx;
    cropState.y += dy;
    drawCrop();
  });
  cropCanvas.addEventListener('pointerup', (ev) => {
    cropState.dragging = false;
    try { cropCanvas.releasePointerCapture(ev.pointerId); } catch(e){}
  });
}

if (cropZoom) {
  cropZoom.addEventListener('input', () => drawCrop());
}

if (cropCloseBtn) cropCloseBtn.addEventListener('click', () => showCropModal(false));
if (cropCancelBtn) cropCancelBtn.addEventListener('click', () => showCropModal(false));
if (cropBackdrop) cropBackdrop.addEventListener('click', () => showCropModal(false));

async function getCroppedBlob(size = 256) {
  if (!cropCanvas) return null;
  // Render final crop to an offscreen canvas at desired size
  const tmp = document.createElement('canvas');
  tmp.width = size;
  tmp.height = size;
  const ctx = tmp.getContext('2d');

  // Determine current visible portion from cropCanvas
  const sx = 0; const sy = 0; const sw = cropCanvas.width; const sh = cropCanvas.height;
  ctx.drawImage(cropCanvas, sx, sy, sw, sh, 0, 0, size, size);

  return await new Promise((resolve) => tmp.toBlob(resolve, 'image/jpeg', 0.92));
}

// when the user applies crop, get blob and upload
if (cropApplyBtn) {
  cropApplyBtn.addEventListener('click', async () => {
    try {
      setStatus('Applying crop...');
      const blob = await getCroppedBlob(256);
      if (!blob) throw new Error('Unable to produce cropped image');

      // preview immediately
      const reader = new FileReader();
      reader.onload = () => { adminAvatarEl.src = reader.result; };
      reader.readAsDataURL(blob);

      const fd = new FormData();
      fd.append('avatar', blob, 'avatar.jpg');
      setStatus('Uploading avatar...');
      const res = await fetch(`${ADMIN_API}/avatar`, { method: 'POST', headers: getAuthHeaders(), body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      adminAvatarEl.src = resolveAssetUrl(data.avatar);
      updateAvatarIllustrationVisibility();
      setStatus('Avatar updated.');
      showCropModal(false);
    } catch (err) {
      setStatus(err.message || 'Crop/upload failed', true);
    }
  });
}

// Hook to open crop modal when picking file
if (adminAvatarFileInput) {
  adminAvatarFileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await openCropModalWithFile(file);
    } catch (err) {
      setStatus('Unable to load image for cropping', true);
    }
  });
}

const searchInputEl = document.getElementById("searchInput");
state.pagination = state.pagination || { page: 1, perPage: 8 };
state.searchQuery = state.searchQuery || "";
if (searchInputEl) {
  searchInputEl.value = state.searchQuery;
  searchInputEl.addEventListener("input", (e) => {
    state.searchQuery = e.target.value || "";
    state.pagination.page = 1;
    renderDesigns();
  });
}

// Clear field errors on user input
["title","category","imageFile"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => clearFieldError(id));
  el.addEventListener("change", () => clearFieldError(id));
});

// Image preview helpers
const imageFileInput = document.getElementById("imageFile");
const heroFileInput = document.getElementById("heroImageFile");
const galleryFilesInput = document.getElementById("galleryFiles");
const imagePreview = document.getElementById("imagePreview");
const heroPreview = document.getElementById("heroPreview");
const galleryPreview = document.getElementById("galleryPreview");

function clearPreviews() {
  if (imagePreview) imagePreview.innerHTML = "";
  if (heroPreview) heroPreview.innerHTML = "";
  if (galleryPreview) galleryPreview.innerHTML = "";
}

function showImagePreview(file, container) {
  if (!container) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = document.createElement("img");
    img.src = ev.target.result;
    container.innerHTML = "";
    container.appendChild(img);
  };
  reader.readAsDataURL(file);
}

if (imageFileInput) {
  imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) showImagePreview(file, imagePreview);
    else if (imagePreview) imagePreview.innerHTML = "";
  });
}

if (heroFileInput) {
  heroFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) showImagePreview(file, heroPreview);
    else if (heroPreview) heroPreview.innerHTML = "";
  });
}

if (galleryFilesInput) {
  galleryFilesInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (!galleryPreview) return;
    galleryPreview.innerHTML = "";
    files.slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = document.createElement("img");
        img.src = ev.target.result;
        galleryPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.background = isError ? "rgba(162, 59, 46, 0.14)" : "rgba(182, 139, 61, 0.16)";
  statusMessage.style.color = isError ? "#8b2f24" : "#6c3f24";
}

// Server-side soft-delete used; undo snackbar removed.

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
  clearPreviews();
  updateSidebarCounts();
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
        <button type="button" class="danger-btn" data-action="delete">Delete</button>
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

  const query = (state.searchQuery || "").trim().toLowerCase();
  const filtered = state.designs.filter((d) => {
    if (!query) return true;
    return [d.title, d.category, d.style, d.description].some((field) =>
      String(field || "").toLowerCase().includes(query)
    );
  });

  const perPage = state.pagination?.perPage || 8;
  const page = state.pagination?.page || 1;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  state.pagination = { page: Math.min(page, totalPages), perPage };

  if (!filtered.length) {
    designList.innerHTML = '<p class="empty-state">No designs available yet.</p>';
    document.getElementById("designPagination").innerHTML = "";
    return;
  }

  const start = (state.pagination.page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  pageItems.forEach((design) => {
    designList.appendChild(createDesignCard(design));
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById("designPagination");
  container.innerHTML = "";

  const prev = document.createElement("button");
  prev.textContent = "← Prev";
  prev.disabled = state.pagination.page <= 1;
  prev.addEventListener("click", () => {
    state.pagination.page = Math.max(1, state.pagination.page - 1);
    renderDesigns();
  });
  container.appendChild(prev);

  // page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = String(i);
    if (i === state.pagination.page) {
      btn.style.fontWeight = "700";
    }
    btn.addEventListener("click", () => {
      state.pagination.page = i;
      renderDesigns();
    });
    container.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next →";
  next.disabled = state.pagination.page >= totalPages;
  next.addEventListener("click", () => {
    state.pagination.page = Math.min(totalPages, state.pagination.page + 1);
    renderDesigns();
  });
  container.appendChild(next);
}

function updateSidebarCounts() {
  const counts = {
    designs: state.designs.length || 0,
    bookings: state.bookings.length || 0,
    inquiries: state.inquiries.length || 0,
    feedback: state.feedback.length || 0,
    editor: state.editingDesignId ? 1 : 0
  };

  document.querySelectorAll('.nav-count').forEach((span) => {
    const key = span.dataset.for;
    span.textContent = counts[key] !== undefined ? counts[key] : '—';
  });
}

function showFieldError(fieldId, message) {
  try {
    const el = document.getElementById(`error-${fieldId}`);
    if (el) el.textContent = message || "";
  } catch (_e) {}
}

function clearFieldError(fieldId) {
  try {
    const el = document.getElementById(`error-${fieldId}`);
    if (el) el.textContent = "";
  } catch (_e) {}
}

function clearAllFieldErrors() {
  ["title", "category", "imageFile"].forEach(clearFieldError);
}

// Helper: center-crop and resize image to square of `size` px, returns Blob
function resizeAndCropImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function (e) {
      img.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Unable to process image"));
              return;
            }
            resolve(blob);
          }, "image/jpeg", 0.9);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
      const safeEmail = inquiry.email ? String(inquiry.email).trim() : '';
      const mailto = safeEmail ? `mailto:${encodeURIComponent(safeEmail)}?subject=${encodeURIComponent('Re: ' + (inquiry.subject || inquiry.name || 'Your inquiry'))}` : "";
      article.innerHTML = `
        <div class="inquiry-head">
          <div>
            <h4>${inquiry.name || "Guest"}</h4>
            <p class="inquiry-meta">${safeEmail ? `<a href="${mailto}" class="reply-email">${safeEmail}</a>` : 'No email'}${inquiry.phone ? ` | ${inquiry.phone}` : ""}</p>
          </div>
          <span class="card-tag">${inquiry.subject || "General inquiry"}</span>
        </div>
        <p>${inquiry.message || ""}</p>
        <p class="inquiry-meta">${new Date(inquiry.createdAt).toLocaleString()}</p>
          <div class="card-actions"></div>
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
    const bkEmail = booking.email ? String(booking.email).trim() : '';
    const bkSubject = encodeURIComponent('Re: ' + (booking.projectType || 'Booking')); 
    const bkMailto = bkEmail ? `mailto:${encodeURIComponent(bkEmail)}?subject=${bkSubject}` : '';
    article.innerHTML = `
      <div class="inquiry-head">
        <div>
          <h4>${booking.name || "Guest"}</h4>
          <p class="inquiry-meta">${bkEmail ? `<a href="${bkMailto}" class="reply-email">${bkEmail}</a>` : 'No email'}${booking.timeSlot ? ` | ${booking.timeSlot}` : ""}</p>
        </div>
        <span class="card-tag">${booking.projectType || "Consultation"}</span>
      </div>
      <p><strong>Date:</strong> ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : "Not selected"}</p>
      <p><strong>Budget:</strong> ${booking.budget || "Not shared"}</p>
      ${bookingImagesMarkup}
      <p>${booking.requirements || "No extra requirements shared."}</p>
      <p class="inquiry-meta">${new Date(booking.createdAt).toLocaleString()}</p>
      <div class="card-actions"></div>
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
    const fbEmail = item.email ? String(item.email).trim() : '';
    const fbMailto = fbEmail ? `mailto:${encodeURIComponent(fbEmail)}?subject=${encodeURIComponent('Re: Feedback')}` : '';
    article.innerHTML = `
      <div class="inquiry-head">
        <div>
          <h4>${item.name || "Anonymous"}</h4>
          <p class="inquiry-meta">${fbEmail ? `<a href="${fbMailto}" class="reply-email">${fbEmail}</a>` : 'No email'}${item.page ? ` | ${item.page}` : ""}</p>
        </div>
        <span class="card-tag">${item.rating}/5</span>
      </div>
      <p>${item.comment || ""}</p>
      <p class="inquiry-meta">${new Date(item.createdAt).toLocaleString()}</p>
      <div class="card-actions"></div>
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
  updateSidebarCounts();
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
  updateSidebarCounts();
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
  updateSidebarCounts();
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
  updateSidebarCounts();
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
  // Inline validation
  const titleValue = formFields.title.value && formFields.title.value.trim();
  const categoryValue = formFields.category.value && formFields.category.value.trim();
  clearAllFieldErrors();

  let hasError = false;
  if (!titleValue) {
    showFieldError("title", "Title is required.");
    hasError = true;
  }
  if (!categoryValue) {
    showFieldError("category", "Category is required.");
    hasError = true;
  }

  // Ensure there is either a selected file or an image URL
  const fileInput = document.getElementById("imageFile");
  const imageUrl = (formFields.image && formFields.image.value && formFields.image.value.trim()) || "";
  const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
  if (!hasFile && !imageUrl && !state.editingDesignId) {
    showFieldError("imageFile", "Main image file or image URL is required.");
    hasError = true;
  }

  if (hasError) {
    setStatus("Please fix validation errors.", true);
    return;
  }

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
