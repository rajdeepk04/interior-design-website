const authForms = document.querySelectorAll("form[data-auth]");
const passwordToggles = document.querySelectorAll("[data-toggle-password]");
const AUTH_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";
const AUTH_API = `${AUTH_API_ORIGIN}/api/auth`;

/* ================================
   AUTO LOGIN (if already logged in)
================================ */
const existingToken = localStorage.getItem("luxeAuthToken");
const isAdminLoginPage = Boolean(document.querySelector("form[data-admin-login]"));

if (existingToken) {
  try {
    const payload = JSON.parse(atob(existingToken.split(".")[1]));

    if (isAdminLoginPage) {
      if (payload?.role === "admin") {
        window.location.href = "admin.html";
      }
    } else if (payload?.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    localStorage.removeItem("luxeAuthToken");
    localStorage.removeItem("luxeUser");
  }
}

/* ================================
   SHOW MESSAGE
================================ */
function showAuthMessage(form, message, isError = false) {
  const messageBox = form.querySelector("[data-auth-message]");
  if (!messageBox) return;

  messageBox.hidden = false;
  messageBox.className = `auth-message ${isError ? "error" : "success"}`;
  messageBox.textContent = message;
}

/* ================================
   SUBMIT FORM
================================ */
async function submitAuthForm(form) {
  const formData = new FormData(form);

  // 🔥 TRIM VALUES (IMPORTANT FIX)
  const payload = {};
  formData.forEach((value, key) => {
    payload[key] = typeof value === "string" ? value.trim() : value;
  });

  const emailField = form.querySelector('input[name="email"]');
  const rememberField = form.querySelector('input[name="rememberMe"]');
  const isRegisterForm = form.classList.contains("register-form");
  const adminOnlyLogin = form.hasAttribute("data-admin-login");

  const endpoint = isRegisterForm
    ? `${AUTH_API}/register`
    : `${AUTH_API}/login`;

  /* ================================
     REMEMBER EMAIL
  ================================ */
  if (emailField && rememberField) {
    if (rememberField.checked) {
      localStorage.setItem("luxeRememberedEmail", emailField.value.trim());
    } else {
      localStorage.removeItem("luxeRememberedEmail");
    }
  }

  /* ================================
     API CALL
  ================================ */
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  if (adminOnlyLogin && (data.role || data.user?.role) !== "admin") {
    throw new Error("This login page is only for admin accounts.");
  }

  /* ================================
     SAVE USER + TOKEN
  ================================ */
  if (data.user) {
    localStorage.setItem("luxeUser", JSON.stringify(data.user));
    localStorage.setItem(
      "luxeRememberedEmail",
      data.user.email || payload.email || ""
    );
  }

  if (data.token) {
    localStorage.setItem("luxeAuthToken", data.token);
  }

  /* ================================
     SUCCESS MESSAGE
  ================================ */
  showAuthMessage(
    form,
    data.message || (isRegisterForm ? "Registration successful." : "Login successful.")
  );

  /* ================================
     REDIRECT
  ================================ */
  if (isRegisterForm) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  // 🔥 ROLE BASED REDIRECT
  setTimeout(() => {
    const role = data.role || data.user?.role;

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  }, 1000);
}

/* ================================
   FORM HANDLING
================================ */
authForms.forEach((form) => {
  const emailField = form.querySelector('input[name="email"]');
  const rememberField = form.querySelector('input[name="rememberMe"]');
  const savedEmail = localStorage.getItem("luxeRememberedEmail");

  if (emailField && savedEmail) {
    emailField.value = savedEmail;
    if (rememberField && !isAdminLoginPage) rememberField.checked = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await submitAuthForm(form);
    } catch (error) {
      showAuthMessage(
        form,
        error.message || "Unable to complete authentication.",
        true
      );
    }
  });
});

/* ================================
   PASSWORD TOGGLE
================================ */
passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const wrapper = toggle.closest(".password-input");
    const passwordInput = wrapper?.querySelector(
      'input[type="password"], input[type="text"]'
    );

    if (!passwordInput) return;

    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "Hide" : "Show";
    toggle.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password"
    );
  });
});
