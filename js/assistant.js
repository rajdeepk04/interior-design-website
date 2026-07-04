const assistantRoot = document.querySelector("[data-ai-assistant]");
const ASSISTANT_API_ORIGIN = window.location.port === "5000" ? window.location.origin : "http://localhost:5000";

if (assistantRoot) {
  const toggleButton = assistantRoot.querySelector("[data-ai-toggle]");
  const messages = assistantRoot.querySelector("[data-ai-messages]");
  const form = assistantRoot.querySelector("[data-ai-form]");
  const input = assistantRoot.querySelector("[data-ai-input]");
  const suggestionButtons = assistantRoot.querySelectorAll("[data-ai-suggestion]");
  const assistantApi = assistantRoot.dataset.aiEndpoint
    ? `${ASSISTANT_API_ORIGIN}${assistantRoot.dataset.aiEndpoint}`
    : `${ASSISTANT_API_ORIGIN}/api/assistant`;
  const STORAGE_KEY = "luxeAssistantHistory";
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechRecognition = SpeechRecognition ? new SpeechRecognition() : null;
  let voiceReplyEnabled = true;

  const controls = document.createElement("div");
  controls.className = "ai-assistant__controls";
  controls.innerHTML = `
    <button type="button" class="ai-assistant__control" data-ai-voice-toggle aria-label="Toggle voice replies">Voice on</button>
    <button type="button" class="ai-assistant__control" data-ai-clear aria-label="Clear chat">Clear</button>
  `;
  form?.before(controls);

  const formActions = document.createElement("div");
  formActions.className = "ai-assistant__form-actions";
  formActions.innerHTML = `
    <button type="button" class="ai-assistant__mic-inline" data-ai-mic-toggle aria-label="Start voice typing">${speechRecognition ? "Mic" : "Mic unavailable"}</button>
    <button type="submit" class="ai-assistant__send-btn">Send</button>
  `;
  const existingSubmitButton = form?.querySelector('button[type="submit"]');
  if (existingSubmitButton) {
    existingSubmitButton.remove();
  }
  form?.appendChild(formActions);

  const voiceToggle = controls.querySelector("[data-ai-voice-toggle]");
  const clearButton = controls.querySelector("[data-ai-clear]");
  const micToggle = formActions.querySelector("[data-ai-mic-toggle]");
  const suggestionIconMarkup = {
    booking: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.5v3"></path>
        <path d="M17 3.5v3"></path>
        <rect x="4" y="5.5" width="16" height="14" rx="3"></rect>
        <path d="M4 10.5h16"></path>
      </svg>
    `,
    wishlist: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.4 4.8 13.6a4.7 4.7 0 0 1 0-6.7 4.8 4.8 0 0 1 6.8 0L12 7.3l.4-.4a4.8 4.8 0 0 1 6.8 0 4.7 4.7 0 0 1 0 6.7Z"></path>
      </svg>
    `,
    contact: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 6.5h15v11h-15z"></path>
        <path d="m5.8 8 6.2 5 6.2-5"></path>
      </svg>
    `
  };

  const controlIconMarkup = {
    voiceOn: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v4.5a2.5 2.5 0 0 1-5 0V7a2.5 2.5 0 0 1 2.5-2.5Z"></path>
        <path d="M7.5 10.5a4.5 4.5 0 0 0 9 0"></path>
        <path d="M12 15v4.5"></path>
        <path d="M9 19.5h6"></path>
      </svg>
    `,
    voiceOff: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v4.5"></path>
        <path d="M9.8 11.2A2.5 2.5 0 0 1 9.5 10V7a2.5 2.5 0 0 1 2.5-2.5"></path>
        <path d="M7.5 10.5a4.5 4.5 0 0 0 6.3 4.1"></path>
        <path d="M12 15v4.5"></path>
        <path d="M9 19.5h6"></path>
        <path d="m5 5 14 14"></path>
      </svg>
    `,
    mic: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v4.5a2.5 2.5 0 0 1-5 0V7a2.5 2.5 0 0 1 2.5-2.5Z"></path>
        <path d="M7.5 10.5a4.5 4.5 0 0 0 9 0"></path>
        <path d="M12 15v4.5"></path>
      </svg>
    `,
    clear: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 7.5h15"></path>
        <path d="M9.5 7.5V5.7a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2v1.8"></path>
        <path d="m7 7.5.8 11a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-11"></path>
      </svg>
    `,
    send: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 12 19.5 4.8l-3.2 14.4-4.4-4.2-3.8 2.3 1.8-5.2Z"></path>
      </svg>
    `
  };
  const pageLinks = {
    booking: [{ label: "Open Booking Page", href: "booking.html" }],
    contact: [{ label: "Open Contact Page", href: "contact.html" }],
    feedback: [{ label: "Open Contact Page", href: "contact.html" }],
    wishlist: [{ label: "Open Wishlist Page", href: "wishlist.html" }],
    auth: [
      { label: "Open Login Page", href: "login.html" },
      { label: "Open Register Page", href: "register.html" }
    ],
    admin: [{ label: "Open Admin Login", href: "admin-login.html" }],
    design: [{ label: "Open Design Page", href: "design.html" }],
    assistant: [{ label: "Open Home Page", href: "index.html" }]
  };

  function iconButtonMarkup(icon, label) {
    return `${icon}<span class="ai-assistant__sr-only">${label}</span>`;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolvePageLinks(message, intent) {
    const lowered = String(message || "").toLowerCase();
    const links = [];
    const seen = new Set();

    function addLink(label, href) {
      const key = `${label}::${href}`;
      if (!seen.has(key)) {
        seen.add(key);
        links.push({ label, href });
      }
    }

    (pageLinks[intent] || []).forEach((link) => addLink(link.label, link.href));

    if (lowered.includes("home")) addLink("Open Home Page", "index.html");
    if (lowered.includes("about")) addLink("Open About Page", "About.html");
    if (lowered.includes("design")) addLink("Open Design Page", "design.html");
    if (lowered.includes("wishlist")) addLink("Open Wishlist Page", "wishlist.html");
    if (lowered.includes("booking") || lowered.includes("consultation")) addLink("Open Booking Page", "booking.html");
    if (lowered.includes("contact") || lowered.includes("inquiry")) addLink("Open Contact Page", "contact.html");
    if (lowered.includes("login") || lowered.includes("sign in")) addLink("Open Login Page", "login.html");
    if (lowered.includes("register") || lowered.includes("sign up")) addLink("Open Register Page", "register.html");
    if (lowered.includes("admin")) addLink("Open Admin Login", "admin-login.html");

    return links;
  }

  suggestionButtons.forEach((button) => {
    const prompt = (button.dataset.aiSuggestion || button.textContent || "").toLowerCase();
    let icon = suggestionIconMarkup.booking;
    let label = "Book consultation";

    if (prompt.includes("save")) {
      icon = suggestionIconMarkup.wishlist;
      label = "Save designs";
    } else if (prompt.includes("contact")) {
      icon = suggestionIconMarkup.contact;
      label = "Contact studio";
    }

    button.innerHTML = iconButtonMarkup(icon, label);
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  });

  if (voiceToggle) {
    voiceToggle.innerHTML = iconButtonMarkup(controlIconMarkup.voiceOn, "Voice on");
    voiceToggle.setAttribute("title", "Voice on");
  }

  if (micToggle) {
    const micLabel = speechRecognition ? "Mic" : "Mic unavailable";
    micToggle.innerHTML = iconButtonMarkup(controlIconMarkup.mic, micLabel);
    micToggle.setAttribute("title", micLabel);
  }

  if (clearButton) {
    clearButton.innerHTML = iconButtonMarkup(controlIconMarkup.clear, "Clear chat");
    clearButton.setAttribute("title", "Clear chat");
  }

  formActions.querySelector(".ai-assistant__send-btn").innerHTML = iconButtonMarkup(controlIconMarkup.send, "Send message");
  formActions.querySelector(".ai-assistant__send-btn").setAttribute("title", "Send");

  if (speechRecognition) {
    speechRecognition.lang = "en-US";
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 1;
  } else {
    micToggle.disabled = true;
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (_error) {
      return [];
    }
  }

  function setHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-12)));
  }

  function speak(text) {
    if (!voiceReplyEnabled || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function appendBubble(text, role, links = []) {
    const bubble = document.createElement("div");
    bubble.className = `ai-assistant__bubble ${role}`;

    const content = document.createElement("p");
    content.className = "ai-assistant__bubble-text";
    content.textContent = text;
    bubble.appendChild(content);

    if (links.length && role.includes("bot")) {
      const linkWrap = document.createElement("div");
      linkWrap.className = "ai-assistant__bubble-links";
      linkWrap.innerHTML = links
        .map((link) => `<a href="${escapeHtml(link.href)}" class="ai-assistant__bubble-link">${escapeHtml(link.label)}</a>`)
        .join("");
      bubble.appendChild(linkWrap);
    }

    messages?.appendChild(bubble);
    messages?.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
  }

  function restoreMessages() {
    const history = getHistory();
    if (!messages) return;
    const existingWelcome = messages.querySelector(".ai-assistant__bubble.bot");
    messages.innerHTML = "";

    if (!history.length && existingWelcome) {
      messages.appendChild(existingWelcome);
      return;
    }

    history.forEach((entry) => {
      appendBubble(entry.text, entry.role, Array.isArray(entry.links) ? entry.links : []);
    });
  }

  function saveMessage(text, role, links = []) {
    const history = getHistory();
    history.push({ text, role, links, createdAt: Date.now() });
    setHistory(history);
  }

  function runLocalAction(message) {
    const lowered = message.toLowerCase();

    if (lowered.includes("open booking")) {
      window.location.href = "booking.html";
      return true;
    }

    if (lowered.includes("open contact")) {
      window.location.href = "contact.html";
      return true;
    }

    if (lowered.includes("open wishlist")) {
      window.location.href = "wishlist.html";
      return true;
    }

    if (lowered.includes("open designs") || lowered.includes("open design page")) {
      window.location.href = "design.html";
      return true;
    }

    if (lowered.includes("open feedback")) {
      document.querySelector("[data-feedback-widget]")?.classList.add("open");
      return true;
    }

    return false;
  }

  async function requestReply(message) {
    try {
      const response = await fetch(assistantApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: getHistory(),
          context: {
            page: window.location.pathname.split("/").pop() || "index.html",
            title: document.title
          }
        })
      });

      if (!response.ok) {
        throw new Error("Assistant request failed.");
      }

      const data = await response.json();

      if (typeof data.reply === "string" && data.reply.trim()) {
        return {
          text: data.reply.trim(),
          intent: data.intent || "",
          links: resolvePageLinks(message, data.intent || "")
        };
      }
    } catch (_error) {
      return {
        text: "I can guide you through booking, designs, feedback, contact, and login flows. Try asking me to open one of those pages.",
        intent: "fallback",
        links: resolvePageLinks(message, "fallback")
      };
    }
  }

  async function sendMessage(message) {
    const text = message.trim();
    if (!text) return;

    if (runLocalAction(text)) {
      return;
    }

    appendBubble(text, "user");
    saveMessage(text, "user");
    appendBubble("Thinking through your question...", "bot pending");

    const pendingBubble = messages?.querySelector(".ai-assistant__bubble.pending:last-child");
    const reply = await requestReply(text);

    if (pendingBubble) {
      pendingBubble.remove();
    }

    appendBubble(reply.text, "bot", reply.links || []);
    saveMessage(reply.text, "bot", reply.links || []);
    speak(reply.text);
  }

  toggleButton?.addEventListener("click", () => {
    assistantRoot.classList.toggle("open");
  });

  suggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.aiSuggestion || button.textContent || "");
      assistantRoot.classList.add("open");
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input?.value || "");
    if (input) input.value = "";
    assistantRoot.classList.add("open");
  });

  voiceToggle?.addEventListener("click", () => {
    voiceReplyEnabled = !voiceReplyEnabled;
    const voiceLabel = voiceReplyEnabled ? "Voice on" : "Voice off";
    voiceToggle.innerHTML = iconButtonMarkup(
      voiceReplyEnabled ? controlIconMarkup.voiceOn : controlIconMarkup.voiceOff,
      voiceLabel
    );
    voiceToggle.setAttribute("title", voiceLabel);
    if (!voiceReplyEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  micToggle?.addEventListener("click", () => {
    if (!speechRecognition) return;
    speechRecognition.start();
    micToggle.setAttribute("title", "Listening");
    micToggle.classList.add("is-listening");
  });

  speechRecognition?.addEventListener("result", (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (input) input.value = transcript;
    micToggle?.classList.remove("is-listening");
    micToggle?.setAttribute("title", "Mic");
    sendMessage(transcript);
    assistantRoot.classList.add("open");
  });

  speechRecognition?.addEventListener("end", () => {
    micToggle?.classList.remove("is-listening");
    micToggle?.setAttribute("title", "Mic");
  });

  speechRecognition?.addEventListener("error", () => {
    micToggle?.classList.remove("is-listening");
    micToggle?.setAttribute("title", "Mic");
  });

  clearButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    if (messages) {
      messages.innerHTML = '<div class="ai-assistant__bubble bot"><p class="ai-assistant__bubble-text">Hi, I\'m your Luxe assistant. Ask me anything about the website or your design journey.</p></div>';
    }
  });

  restoreMessages();
}
