// ================================
// LOAD ENV VARIABLES (IMPORTANT)
// ================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const mysql = require("mysql2");
const nodemailer = require("nodemailer"); // ✅ NEW

const app = express();
const authRoutes = require("./routes/authRoutes.js");
console.log("authRoutes import loaded");


const designRoutes = require("./routes/designRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const contactRoutes = require("./routes/contactroute");
const adminRoutes = require("./routes/adminroute");
const debugRoutes = require("./routes/debugRoutes");

const { notFound, errorHandler } = require("./middleware/errormiddleware");
const { initializeDatabase } = require("./database/db");




// ================================
// PORT FROM ENV
// ================================

const PORT = process.env.PORT || 5000;


// ================================
// ✅ ENV DEBUG (VERY IMPORTANT)
// ================================

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS
    ? "Loaded ✅"
    : "Missing ❌"
);


// ================================
// ✅ SMTP VERIFY (IMPORTANT)
// ================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP connection
transporter.verify(function (error, success) {

  if (error) {

    console.log("❌ SMTP Error:", error);

  } else {

    console.log("✅ SMTP Ready");

  }

});


// ================================
// SITE ASSISTANT REPLIES
// ================================

const assistantKnowledge = {
  booking: "You can book a consultation from the booking page by sharing your project type, preferred date, budget, room images, and design requirements.",
  wishlist: "Use the heart button on the designs page to save ideas to your wishlist, then compare them later on the wishlist page.",
  contact: "The contact page lets visitors send inquiries directly to the studio. Those inquiries also appear in the admin panel for review.",
  feedback: "The feedback button on the right side of the website opens a quick form. Submitted feedback is stored and visible in the admin panel.",
  auth: "Users can register and log in with their account details. Admins should use the separate admin login page to access the admin dashboard.",
  admin: "The admin panel lets you add, update, and delete designs, upload images, review inquiries, and review feedback from visitors.",
  design: "The design page includes residential, commercial, kitchen, bedroom, and bathroom concepts. Users can preview and save designs to wishlist.",
  assistant: "I can help explain how the website works, guide visitors to the right page, and respond with voice if voice output is enabled."
};

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildAssistantReply(message = "", history = [], context = {}) {
  const lowered = String(message).toLowerCase().trim();
  const currentPage = String(context.page || "").toLowerCase();
  const recentUserTopics = history
    .filter((entry) => entry && entry.role === "user")
    .slice(-3)
    .map((entry) => String(entry.text || "").toLowerCase())
    .join(" ");

  const combinedContext = `${recentUserTopics} ${lowered}`;

  if (!lowered) {
    return {
      reply: "Ask me about booking, designs, wishlist, feedback, contact, or admin access and I’ll guide you.",
      intent: "empty"
    };
  }

  if (includesAny(combinedContext, ["open booking", "go to booking", "book consultation"])) {
    return {
      reply: "Open the booking page to schedule your consultation. You can choose a date, time, budget, and share room images there.",
      intent: "booking"
    };
  }

  if (includesAny(combinedContext, ["open contact", "contact studio", "send inquiry", "talk to studio"])) {
    return {
      reply: assistantKnowledge.contact,
      intent: "contact"
    };
  }

  if (includesAny(combinedContext, ["feedback", "review this site", "share feedback"])) {
    return {
      reply: assistantKnowledge.feedback,
      intent: "feedback"
    };
  }

  if (includesAny(combinedContext, ["wishlist", "save design", "heart button", "favorites"])) {
    return {
      reply: assistantKnowledge.wishlist,
      intent: "wishlist"
    };
  }

  if (includesAny(combinedContext, ["admin", "dashboard", "admin login"])) {
    return {
      reply: assistantKnowledge.admin,
      intent: "admin"
    };
  }

  if (includesAny(combinedContext, ["login", "register", "sign in", "sign up", "profile"])) {
    return {
      reply: assistantKnowledge.auth,
      intent: "auth"
    };
  }

  if (includesAny(combinedContext, ["design", "portfolio", "kitchen", "bedroom", "bathroom", "commercial", "residential"])) {
    const pageHint = currentPage.includes("design")
      ? "You are already on a design-related page, so you can start exploring the visible cards right away."
      : "Open the design page to browse the full portfolio.";

    return {
      reply: `${assistantKnowledge.design} ${pageHint}`,
      intent: "design"
    };
  }

  if (includesAny(combinedContext, ["book", "consultation", "appointment", "slot", "budget"])) {
    return {
      reply: assistantKnowledge.booking,
      intent: "booking"
    };
  }

  if (includesAny(combinedContext, ["what can you do", "who are you", "help me", "assistant"])) {
    return {
      reply: assistantKnowledge.assistant,
      intent: "assistant"
    };
  }

  return {
    reply: "I can help with booking, designs, wishlist, feedback, contact, login, or admin access. Tell me what you want to do and I’ll guide you.",
    intent: "fallback"
  };
}


// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ================================
// STATIC FILES
// ================================

app.use(express.static(
  path.join(__dirname, "..")
));

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// ================================
// PAGE ALIASES
// ================================

const pageAliases = {

  "/about.html": "About.html",

  "/designs.html": "design.html",

  "/designdetails.html": "designdetails.html"

};

Object.entries(pageAliases).forEach(
  ([routePath, fileName]) => {

    app.get(routePath,
      (_req, res) => {

        res.sendFile(
          path.join(__dirname, "..", fileName)
        );

      });

  }
);


// ================================
// HEALTH CHECK
// ================================

app.get("/api/health",
  (_req, res) => {

    res.json({
      status: "ok",
      message: "Server running successfully"
    });

  }
);


// ================================
// REQUEST LOGGER
// ================================

app.use((req, res, next) => {

  console.log(
    "REQUEST:",
    req.method,
    req.url
  );

  next();

});


// ================================
// AUTH ROUTES
// ================================

console.log("BEFORE AUTH ROUTES");

app.use(
  "/api/auth",

  (req, res, next) => {

    console.log("🔥 HIT /api/auth");

    next();

  },

  authRoutes
);

console.log("AFTER AUTH ROUTES");


// ================================
// OTHER ROUTES
// ================================

app.use("/api/designs", designRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/debug", debugRoutes);


// ================================
// ASSISTANT API
// ================================

app.post("/api/assistant",
  (req, res) => {
    const result = buildAssistantReply(
      req.body?.message,
      Array.isArray(req.body?.history) ? req.body.history : [],
      req.body?.context || {}
    );

    res.json({
      reply: result.reply,
      intent: result.intent
    });

  }
);


// ================================
// ERROR HANDLING
// ================================

app.use(notFound);

app.use(errorHandler);


// ================================
// START SERVER
// ================================

async function startServer() {

  try {

    await initializeDatabase();

    app.listen(
      PORT,
      () => {

        console.log(
          `🚀 Server running on http://localhost:${PORT}`
        );

      }
    );

  }

  catch (error) {

    console.error(
      "❌ Failed to initialize the database:",
      error.message
    );

    process.exit(1);

  }

}

startServer();
