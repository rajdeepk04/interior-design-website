const WISHLIST_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";
const API = `${WISHLIST_API_ORIGIN}/api/wishlist`;
const STORAGE_KEY = "luxeWishlist";

const state = {
  activeCategory: "all",
  searchQuery: ""
};

const wishlistGrid = document.getElementById("wishlistGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterBar = document.getElementById("filterBar");
const clearWishlistBtn = document.getElementById("clearWishlistBtn");
const savedCount = document.getElementById("savedCount");
const categoryCount = document.getElementById("categoryCount");
const resultCount = document.getElementById("resultCount");
const boardTitle = document.getElementById("boardTitle");
const summaryList = document.getElementById("summaryList");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

function getWishlistItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (_error) {
    return [];
  }
}

function setWishlistItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("luxeUser") || "null");
  } catch (_error) {
    return null;
  }
}

function getFilteredItems() {
  return getWishlistItems().filter((item) => {
    const matchesCategory = state.activeCategory === "all" || item.category === state.activeCategory;
    const query = state.searchQuery.trim().toLowerCase();
    const haystack = `${item.title || ""} ${item.category || ""} ${item.style || ""} ${item.description || ""}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
}

function syncStats(items) {
  savedCount.textContent = items.length;
  categoryCount.textContent = new Set(items.map((item) => item.category).filter(Boolean)).size;
}

function syncSummary(items) {
  if (!items.length) {
    summaryList.innerHTML = `
      <div><strong>Most saved style</strong><span>Waiting for saved designs</span></div>
      <div><strong>Top category</strong><span>Waiting for saved designs</span></div>
      <div><strong>Suggested action</strong><span>Save 3 or more concepts to compare directions.</span></div>
    `;
    return;
  }

  const topCategory = Object.entries(items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

  const topStyle = Object.entries(items.reduce((acc, item) => {
    const key = item.style || "Unspecified style";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unspecified style";

  summaryList.innerHTML = `
    <div><strong>Most saved style</strong><span>${topStyle}</span></div>
    <div><strong>Top category</strong><span>${topCategory}</span></div>
    <div><strong>Suggested action</strong><span>${items.length >= 3 ? "Your shortlist is strong enough for a focused consultation." : "Save a few more options to compare your direction."}</span></div>
  `;
}

function createCard(item) {
  const article = document.createElement("article");
  article.className = "wishlist-card";
  const detailPage = `designdetails.html?id=${encodeURIComponent(item.id)}`;
  article.innerHTML = `
    <img src="${item.image}" alt="${item.title}">
    <div class="card-content">
      <div class="card-top">
        <div>
          <p>${item.style || "Saved design"}</p>
          <h3>${item.title}</h3>
        </div>
        <span class="card-tag">${item.category || "saved"}</span>
      </div>
      <p>${item.description || "A saved concept from your Luxe Interiors portfolio shortlist."}</p>
      <div class="card-actions">
        <a href="${detailPage}" class="view-btn">View Details</a>
        <button class="remove-btn" type="button">Remove</button>
      </div>
    </div>
  `;

  article.querySelector(".remove-btn").addEventListener("click", () => removeItem(item));
  return article;
}

function renderWishlist() {
  const allItems = getWishlistItems();
  const filtered = getFilteredItems();
  syncStats(allItems);
  syncSummary(allItems);

  wishlistGrid.innerHTML = "";
  resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  boardTitle.textContent = state.activeCategory === "all"
    ? "All saved designs"
    : `${state.activeCategory.charAt(0).toUpperCase()}${state.activeCategory.slice(1)} saves`;

  if (!filtered.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  filtered.forEach((item) => wishlistGrid.appendChild(createCard(item)));
}

async function removeItem(item) {
  const nextItems = getWishlistItems().filter((entry) => entry.id !== item.id);
  setWishlistItems(nextItems);
  renderWishlist();

  if (!item.wishlistEntryId) {
    return;
  }

  try {
    await fetch(`${API}/${item.wishlistEntryId}`, { method: "DELETE" });
  } catch (_error) {
    // Local state remains the source of truth when API sync is unavailable.
  }
}

async function clearWishlist() {
  const items = getWishlistItems();
  setWishlistItems([]);
  renderWishlist();

  try {
    await Promise.all(
      items
        .filter((item) => item.wishlistEntryId)
        .map((item) => fetch(`${API}/${item.wishlistEntryId}`, { method: "DELETE" }))
    );
  } catch (_error) {
    // Silent fallback for unavailable backend.
  }
}

menuToggle?.addEventListener("click", () => navMenu.classList.toggle("open"));
document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => navMenu.classList.remove("open"));
});

filterBar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.activeCategory = button.dataset.category;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.category === state.activeCategory);
  });
  renderWishlist();
});

searchInput?.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  renderWishlist();
});

clearWishlistBtn?.addEventListener("click", clearWishlist);

(async function hydrateWishlistIds() {
  const currentUser = getCurrentUser();
  if (!currentUser?.email) {
    renderWishlist();
    return;
  }

  try {
    const response = await fetch(API);
    const items = await response.json();
    const localItems = getWishlistItems();
    const merged = localItems.map((item) => {
      const match = items.find((entry) => entry.userEmail === currentUser.email && entry.title === item.title);
      return match ? { ...item, wishlistEntryId: match.id } : item;
    });
    setWishlistItems(merged);
  } catch (_error) {
    // Local state remains available offline.
  }

  renderWishlist();
})();
