const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const contactForm = document.querySelector("[data-contact-form]");
const contactMessage = document.querySelector("[data-contact-message]");
const CONTACT_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";

menuToggle?.addEventListener("click", () => {
  navMenu?.classList.toggle("open");
});

document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu?.classList.remove("open");
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${CONTACT_API_ORIGIN}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Contact request failed.");
      }

      if (contactMessage) {
        contactMessage.hidden = false;
        contactMessage.className = "contact-message success";
        contactMessage.textContent = "Message sent successfully. Our studio will reach out to you soon.";
      }

      contactForm.reset();
    } catch (_error) {
      if (contactMessage) {
        contactMessage.hidden = false;
        contactMessage.className = "contact-message error";
        contactMessage.textContent = "We could not send your message right now. Please try again.";
      }
    }
  });
}

