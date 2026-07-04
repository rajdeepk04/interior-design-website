const bookingForm = document.querySelector("[data-booking-form]");
const slotButtons = document.querySelectorAll("[data-slot]");
const slotInput = bookingForm?.querySelector('input[name="timeSlot"]');
const uploadInput = bookingForm?.querySelector("[data-room-images]");
const uploadPreview = bookingForm?.querySelector("[data-upload-preview]");
const messageBox = bookingForm?.querySelector("[data-booking-message]");
const backButton = document.querySelector(".back-home-btn");
const BOOKING_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";

function renderUploadPreview(files) {
  if (!uploadPreview) return;

  if (!files.length) {
    uploadPreview.innerHTML = '<p class="upload-placeholder">No room images selected yet.</p>';
    return;
  }

  const items = files
    .map((file) => `
      <article class="upload-preview-card">
        <img src="${URL.createObjectURL(file)}" alt="${file.name}" data-preview-image>
        <p>${file.name}</p>
      </article>
    `)
    .join("");

  uploadPreview.innerHTML = `
    <p class="upload-placeholder">Selected room references:</p>
    <div class="upload-preview-grid">${items}</div>
  `;

  uploadPreview.querySelectorAll("[data-preview-image]").forEach((image) => {
    image.addEventListener("load", () => {
      URL.revokeObjectURL(image.src);
    }, { once: true });
  });
}

slotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    slotButtons.forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");

    if (slotInput) {
      slotInput.value = button.dataset.slot || "";
    }
  });
});

uploadInput?.addEventListener("change", () => {
  const files = Array.from(uploadInput.files || []);
  renderUploadPreview(files);
});

backButton?.addEventListener("click", () => {
  window.history.back();
});

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!slotInput?.value) {
      if (messageBox) {
        messageBox.hidden = false;
        messageBox.className = "booking-message error";
        messageBox.textContent = "Please select a preferred time slot before submitting your booking.";
      }
      return;
    }

    const formData = new FormData(bookingForm);

    try {
      const response = await fetch(`${BOOKING_API_ORIGIN}/api/bookings`, {
        method: "POST",
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Booking request failed.");
      }

      if (messageBox) {
        messageBox.hidden = false;
        messageBox.className = "booking-message success";
        messageBox.textContent = "Booking submitted successfully. Redirecting you to the home page...";
      }

      bookingForm.reset();
      slotButtons.forEach((chip) => chip.classList.remove("active"));
      if (slotInput) slotInput.value = "";
      renderUploadPreview([]);

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 1800);
    } catch (error) {
      const isNetworkIssue = error instanceof TypeError;
      const serverMessage = typeof error?.message === "string" ? error.message : "";

      if (messageBox) {
        messageBox.hidden = false;
        messageBox.className = "booking-message error";
        messageBox.textContent = isNetworkIssue
          ? "Booking failed because the backend server is not connected. Start the backend and check your MySQL credentials, then try again."
          : serverMessage || "We could not submit your booking right now. Please try again.";
      }
    }
  });
}
