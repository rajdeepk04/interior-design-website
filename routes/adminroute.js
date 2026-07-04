const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authmiddleware");
const isAdmin = require("../middleware/adminmiddleware");
const { uploadDesignImages } = require("../middleware/uploadmiddleware");

const {
  getAdminDesigns,
  addDesign,
  deleteDesign,
  hideCatalogDesign,
  updateDesign,   // ✅ NEW
  getInquiries,
  getBookings,
  getFeedback
} = require("../controllers/admincontroller");

/* ================= PROTECTED ADMIN ROUTES ================= */

// ➕ Add Design
router.get("/designs", verifyToken, isAdmin, getAdminDesigns);
router.post("/design", verifyToken, isAdmin, uploadDesignImages, addDesign);
router.post("/design/hide-catalog", verifyToken, isAdmin, hideCatalogDesign);

// ❌ Delete Design
router.delete("/design/:id", verifyToken, isAdmin, deleteDesign);

// ✏️ Update Design (NEW)
router.put("/design/:id", verifyToken, isAdmin, uploadDesignImages, updateDesign);

// 📩 Get Contact Inquiries
router.get("/inquiries", verifyToken, isAdmin, getInquiries);
router.get("/bookings", verifyToken, isAdmin, getBookings);
router.get("/feedback", verifyToken, isAdmin, getFeedback);

module.exports = router;
