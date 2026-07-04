// ===============================
// MOBILE MENU TOGGLE
// ===============================

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {

  menuToggle.addEventListener("click", () => {

    navMenu.classList.toggle("open");
    menuToggle.classList.toggle("active");

  });

  // Close menu when clicking links
  document.querySelectorAll(".nav-menu a").forEach(link => {

    link.addEventListener("click", () => {

      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");

    });

  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {

    if (
      !menuToggle.contains(e.target) &&
      !navMenu.contains(e.target)
    ) {
      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");
    }

  });

}



// ===============================
// CONTACT FORM
// ===============================

const contactForm = document.querySelector("[data-contact-form]");
const contactMessage = document.querySelector("[data-contact-message]");

if (contactForm && contactMessage) {

  contactForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {

      const res = await fetch("http://localhost:5000/api/contact", {

        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)

      });

      if (!res.ok) throw new Error("Request failed");

      contactMessage.hidden = false;
      contactMessage.className = "contact-message success";
      contactMessage.textContent = "Message sent successfully!";

      contactForm.reset();

    } catch (error) {

      contactMessage.hidden = false;
      contactMessage.className = "contact-message";
      contactMessage.textContent = "Error sending message! Please try again.";

      console.error("Contact error:", error);

    }

  });

}