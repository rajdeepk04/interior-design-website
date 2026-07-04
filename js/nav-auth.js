function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("luxeUser") || "null");
  } catch (_error) {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem("luxeUser");
  localStorage.removeItem("luxeAuthToken");
}

function createUserNavItem(user) {
  const item = document.createElement("li");
  item.className = "nav-user-slot";
  const destination = user.role === "admin" ? "admin.html" : "#";
  item.innerHTML = `
    <a href="${destination}" class="nav-user-pill" title="${user.email || user.name}">
      <span class="nav-user-avatar">${(user.name || "U").trim().charAt(0).toUpperCase()}</span>
      <span class="nav-user-name">${user.name || user.email || "User"}</span>
    </a>
  `;
  return item;
}

function createAdminNavItem() {
  const item = document.createElement("li");
  item.className = "nav-auth-item";

  const link = document.createElement("a");
  link.href = "admin.html";
  link.className = "nav-cta";
  link.textContent = "Admin Panel";

  item.appendChild(link);
  return item;
}

function createLogoutNavItem() {
  const item = document.createElement("li");
  item.className = "nav-auth-item";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-logout-btn";
  button.textContent = "Logout";
  button.addEventListener("click", () => {
    clearStoredSession();
    window.location.href = "login.html";
  });

  item.appendChild(button);
  return item;
}

function initializeNavbarAuth() {
  const navMenu = document.querySelector(".nav-menu");
  if (!navMenu) return;

  navMenu.querySelectorAll(".nav-user-slot, .nav-auth-item").forEach((node) => node.remove());

  const user = getStoredUser();
  const loginLink = navMenu.querySelector('a[href="login.html"]')?.closest("li");
  const registerLink = navMenu.querySelector('a[href="register.html"]')?.closest("li");

  if (!user) {
    if (loginLink) loginLink.hidden = false;
    if (registerLink) registerLink.hidden = false;
    return;
  }

  if (loginLink) loginLink.hidden = true;
  if (registerLink) registerLink.hidden = true;

  if (user.role === "admin") {
    navMenu.appendChild(createAdminNavItem());
  }

  navMenu.appendChild(createUserNavItem(user));
  navMenu.appendChild(createLogoutNavItem());
}

initializeNavbarAuth();
