const fallbackDesigns = Array.isArray(window.DESIGN_LIBRARY) ? window.DESIGN_LIBRARY : [];
const DESIGN_DETAILS_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";
const params = new URLSearchParams(window.location.search);
const requestedId = Number(params.get("id"));
const requestedSource = (params.get("source") || "api").toLowerCase();

const titleEl = document.getElementById("detailTitle");
const leadEl = document.getElementById("detailLead");
const heroImageEl = document.getElementById("detailHeroImage");
const overviewHeadingEl = document.getElementById("overviewHeading");
const overviewEl = document.getElementById("detailOverview");
const statCategoryEl = document.getElementById("statCategory");
const statAreaEl = document.getElementById("statArea");
const statTimelineEl = document.getElementById("statTimeline");
const statStyleEl = document.getElementById("statStyle");
const paletteSwatchesEl = document.getElementById("paletteSwatches");
const featureListEl = document.getElementById("featureList");
const timelineListEl = document.getElementById("timelineList");
const detailGalleryEl = document.getElementById("detailGallery");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const detailFallbackImages = {
  residential: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1400&q=80",
  bedroom: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
  bathroom: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1400&q=80",
  design: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1400&q=80"
};

function getDetailFallbackImage(category) {
  return detailFallbackImages[String(category || "design").toLowerCase()] || detailFallbackImages.design;
}

function normalizeDesign(design) {
  const resolvedMedia = typeof window.resolveDesignMedia === "function"
    ? window.resolveDesignMedia(design)
    : null;
  const fallbackImage = getDetailFallbackImage((resolvedMedia && resolvedMedia.mediaCategory) || design.category);
  const image = (resolvedMedia && resolvedMedia.image) || design.image || design.heroImage || fallbackImage;
  const heroImage = (resolvedMedia && resolvedMedia.heroImage) || design.heroImage || design.image || fallbackImage;
  const gallery = resolvedMedia?.gallery || (Array.isArray(design.gallery) ? design.gallery.filter(Boolean) : []);

  return {
    style: "Signature Luxe",
    area: "Custom",
    timeline: "Flexible",
    description: "",
    longDescription: "",
    gallery: gallery.length ? gallery : [image],
    ...design,
    image,
    heroImage,
    mediaCategory: (resolvedMedia && resolvedMedia.mediaCategory) || design.category
  };
}

function createFallbackMaterials() {
  return [
    { name: "Warm Stone", note: "Core finish direction", className: "sand" },
    { name: "Walnut Wood", note: "Joinery accent", className: "walnut" },
    { name: "Soft Linen", note: "Textile layer", className: "oat" },
    { name: "Brushed Bronze", note: "Accent hardware", className: "bronze" }
  ];
}

function createFallbackFeatures(design) {
  return [
    `${design.style || "Signature"} styling curated for a premium ${design.category || "interior"} project.`,
    "Balanced circulation, visual calm, and practical day-to-day comfort.",
    "Layered lighting and texture-led detailing to create depth.",
    "Flexible palette direction suited to consultation-led customization."
  ];
}

function createFallbackProcess() {
  return [
    "Project discovery and design briefing.",
    "Layout, mood, and material direction.",
    "Review, refinement, and final detailing.",
    "Execution support and finishing guidance."
  ];
}

function renderDesign(design) {
  document.title = `${design.title} | Luxe Interiors`;
  titleEl.textContent = design.title;
  leadEl.textContent = design.description;
  heroImageEl.src = design.heroImage || design.image;
  heroImageEl.alt = design.title;
  heroImageEl.dataset.fallbackImage = getDetailFallbackImage(design.mediaCategory || design.category);
  overviewHeadingEl.textContent = `${design.style} shaped for ${design.category} living.`;
  overviewEl.textContent = design.longDescription || design.description;
  statCategoryEl.textContent = design.category;
  statAreaEl.textContent = design.area || "Custom";
  statTimelineEl.textContent = design.timeline || "Flexible";
  statStyleEl.textContent = design.style || "Signature Luxe";

  const galleryImages = design.gallery?.length ? design.gallery : [design.image].filter(Boolean);
  heroImageEl.src = design.heroImage || galleryImages[0] || design.image;
  heroImageEl.addEventListener("error", () => {
    heroImageEl.src = heroImageEl.dataset.fallbackImage || getDetailFallbackImage(design.mediaCategory || design.category);
  }, { once: true });

  const materials = design.materials?.length ? design.materials : createFallbackMaterials();
  paletteSwatchesEl.innerHTML = materials.map((material) => `
    <div><span class="swatch ${material.className || "sand"}"></span><b>${material.name}</b><small>${material.note}</small></div>
  `).join("");

  const features = design.features?.length ? design.features : createFallbackFeatures(design);
  featureListEl.innerHTML = features.map((feature) => `<li>${feature}</li>`).join("");

  const process = design.process?.length ? design.process : createFallbackProcess();
  timelineListEl.innerHTML = process.map((step, index) => `<div><strong>${String(index + 1).padStart(2, "0")}</strong><span>${step}</span></div>`).join("");
  detailGalleryEl.innerHTML = galleryImages.map((image, index) => `<img src="${image}" alt="${design.title} view ${index + 1}" data-fallback-image="${getDetailFallbackImage(design.mediaCategory || design.category)}">`).join("");
  detailGalleryEl.querySelectorAll("img[data-fallback-image]").forEach((image) => {
    image.addEventListener("error", () => {
      image.src = image.dataset.fallbackImage || getDetailFallbackImage(design.mediaCategory || design.category);
    }, { once: true });
  });
}

async function loadDesign() {
  if (requestedSource !== "catalog") {
    try {
      const response = await fetch(`${DESIGN_DETAILS_API_ORIGIN}/api/designs/${requestedId}`);
      if (response.ok) {
        const design = normalizeDesign(await response.json());
        renderDesign(design);
        return;
      }
    } catch (_error) {
      // Fall back to bundled data when API is unavailable.
    }
  }

  const fallback = normalizeDesign(
    fallbackDesigns.find((item) => item.id === requestedId) || fallbackDesigns[0] || {}
  );

  if (fallback.title) {
    renderDesign(fallback);
  }
}

menuToggle?.addEventListener("click", () => navMenu.classList.toggle("open"));
loadDesign();
