document.addEventListener("DOMContentLoaded", () => {

  console.log("✅ Reset Password JS Loaded");

  const form =
    document.querySelector("#resetForm");

  const message =
    document.querySelector("#message");

  if (!form) {
    console.error("❌ Reset form not found");
    return;
  }

  if (!message) {
    console.error("❌ Message div missing (#message)");
  }

  /* =========================
     GET TOKEN FROM URL
  ========================= */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const token =
    params.get("token");

  console.log("🔑 Token:", token);

  /* Show warning if token missing */

  if (!token) {

    showMessage(
      "Reset token missing in URL.",
      true
    );

    return;
  }

  /* =========================
     FORM SUBMIT
  ========================= */

  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const password =
        form.password.value.trim();

      const confirmPassword =
        form.confirmPassword.value.trim();

      /* VALIDATION */

      if (!password ||
          !confirmPassword) {

        showMessage(
          "All fields required",
          true
        );

        return;
      }

      if (password.length < 6) {

        showMessage(
          "Password must be at least 6 characters",
          true
        );

        return;
      }

      if (password !== confirmPassword) {

        showMessage(
          "Passwords do not match",
          true
        );

        return;
      }

      try {

        console.log(
          "📡 Sending reset request..."
        );

        const response =
          await fetch(
            `http://localhost:5000/api/auth/reset-password/${token}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                password
              })
            }
          );

        const result =
          await response.json();

        console.log(
          "📨 Server Response:",
          result
        );

        if (!response.ok) {

          showMessage(
            result.message ||
            "Reset failed",
            true
          );

          return;
        }

        showMessage(
          "✅ Password reset successful!",
          false
        );

        form.reset();

        /* Redirect to login */

        setTimeout(() => {

          window.location.href =
            "login.html";

        }, 2000);

      }

      catch (error) {

        console.error(
          "❌ Reset Error:",
          error
        );

        showMessage(
          "Server error",
          true
        );

      }

    }
  );


  /* =========================
     MESSAGE FUNCTION
  ========================= */

  function showMessage(text, isError) {

    if (!message) return;

    message.innerHTML = text;

    message.className =
      "auth-message " +
      (isError
        ? "error"
        : "success");

    message.style.display =
      "block";

  }

});