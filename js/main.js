const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const homeFeaturedGrid = document.getElementById("homeFeaturedGrid");
const HOME_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";
const homeCatalogDesigns = Array.isArray(window.DESIGN_LIBRARY) ? [...window.DESIGN_LIBRARY] : [];
const homeFallbackImages = {
  residential: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
  bedroom: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  bathroom: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
  design: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80"
};

menuToggle?.addEventListener("click", () => {
  navMenu?.classList.toggle("open");
});

document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu?.classList.remove("open");
  });
});

function getHomeFallbackImage(category) {
  return homeFallbackImages[String(category || "design").toLowerCase()] || homeFallbackImages.design;
}

function normalizeHomeDesign(design) {
  const resolvedMedia = typeof window.resolveDesignMedia === "function"
    ? window.resolveDesignMedia(design)
    : null;
  const fallbackImage = getHomeFallbackImage((resolvedMedia && resolvedMedia.mediaCategory) || design.category);
  return {
    image: fallbackImage,
    heroImage: fallbackImage,
    title: "Featured Design",
    category: "design",
    style: "Signature Luxe",
    area: "Custom",
    description: "",
    source: "catalog",
    ...design,
    image: (resolvedMedia && resolvedMedia.image) || design.image || design.heroImage || fallbackImage,
    heroImage: (resolvedMedia && resolvedMedia.heroImage) || design.heroImage || design.image || fallbackImage,
    mediaCategory: (resolvedMedia && resolvedMedia.mediaCategory) || design.category
  };
}

function getHomeDesignIdentity(design) {
  return `${String(design.title || "").trim().toLowerCase()}::${String(design.category || "").trim().toLowerCase()}`;
}

function mergeHomeDesigns(apiDesigns = [], bundledDesigns = []) {
  const merged = new Map();

  bundledDesigns.forEach((design) => {
    const normalized = normalizeHomeDesign({
      ...design,
      source: "catalog"
    });
    merged.set(getHomeDesignIdentity(normalized), normalized);
  });

  apiDesigns.forEach((design) => {
    const normalized = normalizeHomeDesign({
      ...design,
      source: "api"
    });
    const key = normalized.catalogIdentity || getHomeDesignIdentity(normalized);
    if (normalized.isHidden) {
      merged.delete(key);
      return;
    }
    merged.set(key, normalized);
  });

  return Array.from(merged.values());
}

function getCategoryLabel(category) {
  const value = String(category || "design").toLowerCase();
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Feature`;
}

function createHomeFeaturedCard(design, className, secondaryAction) {
  return `
    <article class="featured-card ${className}">
      <img src="${design.image || design.heroImage}" alt="${design.title}" data-fallback-image="${getHomeFallbackImage(design.mediaCategory || design.category)}">
      <div class="featured-content">
        <p>${getCategoryLabel(design.category)}</p>
        <h3>${design.title}</h3>
        <div class="featured-meta"><span>${design.style || "Signature Luxe"}</span><span>${design.area || "Custom"}</span></div>
        <div class="featured-actions">
          <a href="designdetails.html?source=${encodeURIComponent(design.source || "catalog")}&id=${encodeURIComponent(design.id)}" class="primary-btn small">View Details</a>
          <a href="${secondaryAction.href}" class="ghost-btn small">${secondaryAction.label}</a>
        </div>
      </div>
    </article>
  `;
}

function getFeaturedSelection(designs) {
  const residential = designs.find((design) => String(design.category).toLowerCase() === "residential") || designs[0];
  const commercial = designs.find((design) => String(design.category).toLowerCase() === "commercial" && design !== residential) || designs.find((design) => design !== residential) || residential;
  return [residential, commercial].filter(Boolean);
}

function renderHomeFeatured(designs) {
  if (!homeFeaturedGrid) return;

  const [primary, secondary] = getFeaturedSelection(designs);
  const accentCard = `
    <article class="featured-card accent-card process-card-home">
      <div class="accent-copy">
        <p class="panel-label">Featured Flow</p>
        <h3>Move from inspiration to a confident brief.</h3>
        <ul>
          <li>Explore full design details before shortlisting.</li>
          <li>Compare your favorite concepts in the wishlist.</li>
          <li>Book a consultation with a stronger visual direction.</li>
        </ul>
        <a href="booking.html" class="primary-btn small">Book a Session</a>
      </div>
    </article>
  `;

  if (!primary || !secondary) {
    return;
  }

  homeFeaturedGrid.innerHTML = [
    createHomeFeaturedCard(primary, "tall-feature", { href: "wishlist.html", label: "Save Direction" }),
    createHomeFeaturedCard(secondary, "wide-feature", { href: "design.html", label: "Open Portfolio" }),
    accentCard
  ].join("");

  homeFeaturedGrid.querySelectorAll("img[data-fallback-image]").forEach((image) => {
    image.addEventListener("error", () => {
      image.src = image.dataset.fallbackImage || homeFallbackImages.design;
    }, { once: true });
  });
}

async function loadHomeFeaturedDesigns() {
  if (!homeFeaturedGrid) return;

  try {
    const response = await fetch(`${HOME_API_ORIGIN}/api/designs`);
    if (!response.ok) {
      throw new Error("Unable to load home designs.");
    }

    const apiDesigns = await response.json();
    renderHomeFeatured(mergeHomeDesigns(Array.isArray(apiDesigns) ? apiDesigns : [], homeCatalogDesigns));
  } catch (_error) {
    renderHomeFeatured(mergeHomeDesigns([], homeCatalogDesigns));
  }
}

loadHomeFeaturedDesigns();
