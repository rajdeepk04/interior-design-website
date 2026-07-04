const FEEDBACK_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";
const FEEDBACK_API = `${FEEDBACK_API_ORIGIN}/api/reviews`;

if (!document.querySelector("[data-feedback-widget]")) {
  const widget = document.createElement("div");
  widget.className = "feedback-widget";
  widget.setAttribute("data-feedback-widget", "");
  widget.innerHTML = `
    <div class="feedback-widget__panel">
      <div>
        <p>Share Feedback</p>
        <h3>Tell us how the site feels.</h3>
        <p>Your feedback goes straight to the admin panel for review.</p>
      </div>
      <form class="feedback-widget__form" data-feedback-form>
        <div class="feedback-widget__row">
          <label>
            <span>Name</span>
            <input type="text" name="name" placeholder="Your name">
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com">
          </label>
        </div>
        <div class="feedback-widget__row">
          <label>
            <span>Rating</span>
            <select name="rating">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Needs work</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>
          <label>
            <span>Page</span>
            <input type="text" name="page" value="${window.location.pathname.split("/").pop() || "index.html"}" readonly>
          </label>
        </div>
        <label>
          <span>Feedback</span>
          <textarea name="comment" placeholder="What did you like or what should be improved?" required></textarea>
        </label>
        <div class="feedback-widget__message" data-feedback-message hidden></div>
        <button type="submit">Send Feedback</button>
      </form>
    </div>
    <button type="button" class="feedback-widget__toggle" data-feedback-toggle>Feedback</button>
  `;

  document.body.appendChild(widget);
}

const feedbackWidget = document.querySelector("[data-feedback-widget]");
const feedbackToggle = feedbackWidget?.querySelector("[data-feedback-toggle]");
const feedbackForm = feedbackWidget?.querySelector("[data-feedback-form]");
const feedbackMessage = feedbackWidget?.querySelector("[data-feedback-message]");

function setFeedbackMessage(message, isError = false) {
  if (!feedbackMessage) return;
  feedbackMessage.hidden = false;
  feedbackMessage.className = `feedback-widget__message ${isError ? "error" : "success"}`;
  feedbackMessage.textContent = message;
}

feedbackToggle?.addEventListener("click", () => {
  feedbackWidget.classList.toggle("open");
});

feedbackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(feedbackForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(FEEDBACK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Unable to submit feedback.");
    }

    feedbackForm.reset();
    feedbackForm.elements.page.value = window.location.pathname.split("/").pop() || "index.html";
    setFeedbackMessage("Thanks for the feedback. The admin team can review it now.");
  } catch (_error) {
    setFeedbackMessage("We could not send your feedback right now. Please try again.", true);
  }
});
