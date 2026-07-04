let designs = Array.isArray(window.DESIGN_LIBRARY) ? [...window.DESIGN_LIBRARY] : [];

const state = {
  activeCategory: "all",
  searchQuery: "",
  visibleCount: 6
};

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const filterBar = document.getElementById("filterBar");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const designCount = document.getElementById("designCount");
const wishlistCount = document.getElementById("wishlistCount");
const resultCount = document.getElementById("resultCount");
const galleryTitle = document.getElementById("galleryTitle");
const previewTitle = document.getElementById("previewTitle");
const previewDescription = document.getElementById("previewDescription");
const previewMeta = document.getElementById("previewMeta");
const previewWishlistBtn = document.getElementById("previewWishlistBtn");
const viewer = document.getElementById("viewer");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

function normalizeDesign(design) {
  return {
    style: "Signature Luxe",
    area: "Custom",
    timeline: "Flexible",
    gallery: [],
    ...design,
    gallery: Array.isArray(design.gallery) ? design.gallery : []
  };
}

function getWishlistItems() {
  try {
    return JSON.parse(localStorage.getItem("luxeWishlist") || "[]");
  } catch (_error) {
    return [];
  }
}

function setWishlistItems(items) {
  localStorage.setItem("luxeWishlist", JSON.stringify(items));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("luxeUser") || "null");
  } catch (_error) {
    return null;
  }
}

function isWishlisted(id) {
  return getWishlistItems().some((item) => item.id === id);
}

function updateWishlistCount() {
  wishlistCount.textContent = getWishlistItems().length;
}

function getFilteredDesigns() {
  return designs.filter((design) => {
    const matchesCategory = state.activeCategory === "all" || design.category === state.activeCategory;
    const query = state.searchQuery.trim().toLowerCase();
    const matchesSearch = !query || `${design.title} ${design.category} ${design.style} ${design.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderViewer(design) {
  if (design.model) {
    viewer.className = "viewer-frame";
    viewer.innerHTML = `
      <iframe
        title="${design.title} 3D Preview"
        src="https://sketchfab.com/models/${design.model}/embed"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowfullscreen>
      </iframe>
    `;
    return;
  }

  viewer.className = "viewer-placeholder";
  viewer.innerHTML = `
    <div>
      <img src="${design.heroImage || design.image}" alt="${design.title}" style="width:100%; border-radius:20px; max-height:320px; object-fit:cover;">
      <p>Image preview for this design.</p>
    </div>
  `;
}

function selectDesign(id) {
  const design = designs.find((item) => item.id === id);
  if (!design) return;
  previewTitle.textContent = design.title;
  previewDescription.textContent = design.description;
  previewMeta.innerHTML = `<span>Category: ${design.category}</span><span>Style: ${design.style}</span><span>Area: ${design.area}</span>`;
  previewWishlistBtn.textContent = isWishlisted(design.id) ? "Saved in Wishlist" : "Save to Wishlist";
  previewWishlistBtn.onclick = () => toggleWishlist(design);
  renderViewer(design);
}

function createCard(design) {
  const wishlisted = isWishlisted(design.id);
  const article = document.createElement("article");
  article.className = "design-card";
  article.innerHTML = `
    <img src="${design.image}" alt="${design.title}">
    <div class="card-content">
      <div class="card-top">
        <div>
          <p class="card-meta">${design.style}</p>
          <h3>${design.title}</h3>
        </div>
        <span class="card-tag">${design.category}</span>
      </div>
      <p>${design.description}</p>
      <div class="card-actions card-actions-heart">
        <button class="preview-btn" type="button">Preview</button>
        <a class="detail-btn" href="designdetails.html?id=${design.id}">Details</a>
        <button class="wishlist-heart ${wishlisted ? "active" : ""}" type="button" aria-label="${wishlisted ? "Remove from wishlist" : "Add to wishlist"}">
          <i class="fa-${wishlisted ? "solid" : "regular"} fa-heart"></i>
        </button>
      </div>
    </div>
  `;

  article.querySelector(".preview-btn").addEventListener("click", () => selectDesign(design.id));
  article.querySelector(".wishlist-heart").addEventListener("click", () => toggleWishlist(design));
  article.addEventListener("click", (event) => {
    if (event.target.tagName !== "BUTTON" && event.target.tagName !== "A" && event.target.tagName !== "I") {
      selectDesign(design.id);
    }
  });

  return article;
}

function renderGallery() {
  const filtered = getFilteredDesigns();
  const visible = filtered.slice(0, state.visibleCount);
  gallery.innerHTML = "";
  resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  galleryTitle.textContent = state.activeCategory === "all"
    ? "All design concepts"
    : `${state.activeCategory.charAt(0).toUpperCase()}${state.activeCategory.slice(1)} concepts`;

  if (!filtered.length) {
    gallery.innerHTML = `<div class="empty-state"><h3>No matching concepts found</h3><p>Try a different search term or switch to another category.</p></div>`;
    loadMoreBtn.style.display = "none";
    return;
  }

  visible.forEach((design) => gallery.appendChild(createCard(design)));
  loadMoreBtn.style.display = filtered.length > state.visibleCount ? "inline-flex" : "none";
}

async function syncWishlist(design) {
  const currentUser = getCurrentUser();

  try {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designId: design.id,
        title: design.title,
        category: design.category,
        image: design.image,
        description: design.description,
        userEmail: currentUser?.email || null
      })
    });

    if (!response.ok) {
      throw new Error("Wishlist sync failed.");
    }

    return await response.json();
  } catch (_error) {
    return null;
  }
}

async function toggleWishlist(design) {
  const items = getWishlistItems();
  const existingItem = items.find((item) => item.id === design.id);
  const exists = Boolean(existingItem);
  const next = exists
    ? items.filter((item) => item.id !== design.id)
    : [...items, design];

  setWishlistItems(next);
  updateWishlistCount();
  renderGallery();

  if (previewTitle.textContent === design.title) {
    previewWishlistBtn.textContent = exists ? "Save to Wishlist" : "Saved in Wishlist";
  }

  if (exists && existingItem?.wishlistEntryId) {
    try {
      await fetch(`/api/wishlist/${existingItem.wishlistEntryId}`, { method: "DELETE" });
    } catch (_error) {
      // Keep local support when API sync is unavailable.
    }
    return;
  }

  if (!exists) {
    const savedEntry = await syncWishlist(design);
    if (savedEntry?.id) {
      const syncedItems = getWishlistItems().map((item) =>
        item.id === design.id ? { ...item, wishlistEntryId: savedEntry.id } : item
      );
      setWishlistItems(syncedItems);
    }
  }
}

function applyCategory(category) {
  state.activeCategory = category;
  state.visibleCount = 6;
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  renderGallery();
}

async function loadDesignsFromApi() {
  try {
    const response = await fetch("/api/designs");
    if (!response.ok) {
      throw new Error("Unable to load designs.");
    }

    const apiDesigns = await response.json();
    if (Array.isArray(apiDesigns) && apiDesigns.length) {
      designs = apiDesigns.map(normalizeDesign);
    } else {
      designs = designs.map(normalizeDesign);
    }
  } catch (_error) {
    designs = designs.map(normalizeDesign);
  }
}

menuToggle?.addEventListener("click", () => navMenu.classList.toggle("open"));
document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => navMenu.classList.remove("open"));
});
filterBar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) applyCategory(button.dataset.category);
});
searchInput?.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  state.visibleCount = 6;
  renderGallery();
});
loadMoreBtn?.addEventListener("click", () => {
  state.visibleCount += 3;
  renderGallery();
});

(async function initializeDesignGallery() {
  await loadDesignsFromApi();
  designCount.textContent = designs.length;
  updateWishlistCount();
  renderGallery();
  if (designs[0]) {
    selectDesign(designs[0].id);
  }
})();
