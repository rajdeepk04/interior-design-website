console.log("Forgot Password JS Loaded");

const form =
  document.querySelector("#forgotForm");

const message =
  document.querySelector("#message");

/* Safety check */
if (!form) {
  console.error("Forgot form not found");
}

form.addEventListener("submit",
  async (e) => {

  e.preventDefault();

  console.log("Form submitted");

  const emailInput =
    document.querySelector("#email");

  const email =
    emailInput.value.trim();

  if (!email) {

    showMessage(
      "Please enter email",
      true
    );

    return;

  }

  const button =
    form.querySelector("button");

  button.disabled = true;

  button.innerText =
    "Sending...";

  try {

    console.log(
      "Sending request..."
    );

    const response =
      await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email
          })
        }
      );

    const result =
      await response.json();

    console.log("Server Response:", result);

    if (!response.ok) {

      showMessage(
        result.message ||
        "Failed to send reset link",
        true
      );

      return;

    }

    /* Show success message */
    showMessage(
      result.message ||
      "Reset link generated",
      false
    );

    /* Show reset link if available */
    if (result.resetLink) {

      const linkHTML = `
        <br><br>
        <a href="${result.resetLink}"
           target="_blank"
           style="color:blue;">
           Click here to reset password
        </a>
      `;

      message.innerHTML += linkHTML;

      console.log(
        "Reset Link:",
        result.resetLink
      );

    }

    form.reset();

  }

  catch (error) {

    console.error(
      "Fetch Error:",
      error
    );

    showMessage(
      "Server error",
      true
    );

  }

  finally {

    button.disabled = false;

    button.innerText =
      "Send Reset Link";

  }

});


function showMessage(msg, isError) {

  message.innerHTML = msg;

  message.className =
    "auth-message " +
    (isError
      ? "error"
      : "success");

  message.style.display =
    "block";

}