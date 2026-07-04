let designs = [];
const catalogDesigns = Array.isArray(window.DESIGN_LIBRARY) ? [...window.DESIGN_LIBRARY] : [];
const DESIGN_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";

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
const fallbackImages = {
  residential: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
  bedroom: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  bathroom: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
  design: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80"
};

function getFallbackImage(category) {
  return fallbackImages[String(category || "design").toLowerCase()] || fallbackImages.design;
}

function normalizeDesign(design) {
  const resolvedMedia = typeof window.resolveDesignMedia === "function"
    ? window.resolveDesignMedia(design)
    : null;
  const fallbackImage = getFallbackImage((resolvedMedia && resolvedMedia.mediaCategory) || design.category);
  const image = (resolvedMedia && resolvedMedia.image) || design.image || design.heroImage || fallbackImage;
  const heroImage = (resolvedMedia && resolvedMedia.heroImage) || design.heroImage || design.image || fallbackImage;
  const gallery = resolvedMedia?.gallery || (Array.isArray(design.gallery) ? design.gallery.filter(Boolean) : []);

  return {
    style: "Signature Luxe",
    area: "Custom",
    timeline: "Flexible",
    gallery: gallery.length ? gallery : [image],
    source: "catalog",
    ...design,
    image,
    heroImage,
    mediaCategory: (resolvedMedia && resolvedMedia.mediaCategory) || design.category
  };
}

function getDesignKey(design) {
  return `${design.source || "catalog"}-${design.id}`;
}

function getDesignIdentity(design) {
  return `${String(design.title || "").trim().toLowerCase()}::${String(design.category || "").trim().toLowerCase()}`;
}

function mergeDesignSources(apiDesigns = [], bundledDesigns = []) {
  const merged = new Map();

  bundledDesigns.forEach((design) => {
    const normalized = normalizeDesign({
      ...design,
      source: "catalog"
    });
    merged.set(getDesignIdentity(normalized), normalized);
  });

  apiDesigns.forEach((design) => {
    const normalized = normalizeDesign({
      ...design,
      source: "api"
    });
    const key = normalized.catalogIdentity || getDesignIdentity(normalized);
    if (normalized.isHidden) {
      merged.delete(key);
      return;
    }
    merged.set(key, normalized);
  });

  return Array.from(merged.values()).map((design) => ({
    ...design,
    key: getDesignKey(design)
  }));
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
      <img src="${design.heroImage || design.image}" alt="${design.title}" data-fallback-image="${getFallbackImage(design.mediaCategory || design.category)}" style="width:100%; border-radius:20px; max-height:320px; object-fit:cover;">
      <p>Image preview for this design.</p>
    </div>
  `;
  const previewImage = viewer.querySelector("img");
  previewImage?.addEventListener("error", () => {
    previewImage.src = previewImage.dataset.fallbackImage || getFallbackImage(design.mediaCategory || design.category);
  }, { once: true });
}

function selectDesign(id) {
  const design = designs.find((item) => item.key === id);
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
    <img src="${design.image}" alt="${design.title}" data-fallback-image="${getFallbackImage(design.mediaCategory || design.category)}">
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
        <a class="detail-btn" href="designdetails.html?source=${encodeURIComponent(design.source || "catalog")}&id=${encodeURIComponent(design.id)}">Details</a>
        <button class="wishlist-heart ${wishlisted ? "active" : ""}" type="button" aria-label="${wishlisted ? "Remove from wishlist" : "Add to wishlist"}">
          <i class="fa-${wishlisted ? "solid" : "regular"} fa-heart"></i>
        </button>
      </div>
    </div>
  `;

  article.querySelector("img")?.addEventListener("error", (event) => {
    event.currentTarget.src = event.currentTarget.dataset.fallbackImage || getFallbackImage(design.mediaCategory || design.category);
  }, { once: true });
  article.querySelector(".preview-btn").addEventListener("click", () => selectDesign(design.key));
  article.querySelector(".wishlist-heart").addEventListener("click", () => toggleWishlist(design));
  article.addEventListener("click", (event) => {
    if (event.target.tagName !== "BUTTON" && event.target.tagName !== "A" && event.target.tagName !== "I") {
      selectDesign(design.key);
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
    const response = await fetch(`${DESIGN_API_ORIGIN}/api/wishlist`, {
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
      await fetch(`${DESIGN_API_ORIGIN}/api/wishlist/${existingItem.wishlistEntryId}`, { method: "DELETE" });
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
    const response = await fetch(`${DESIGN_API_ORIGIN}/api/designs`);
    if (!response.ok) {
      throw new Error("Unable to load designs.");
    }

    const apiDesigns = await response.json();
    designs = mergeDesignSources(Array.isArray(apiDesigns) ? apiDesigns : [], catalogDesigns);
  } catch (_error) {
    designs = mergeDesignSources([], catalogDesigns);
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
    selectDesign(designs[0].key);
  }
})();
