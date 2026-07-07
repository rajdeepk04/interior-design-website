const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authmiddleware");
const isAdmin = require("../middleware/adminmiddleware");
const { uploadDesignImages } = require("../middleware/uploadmiddleware");
const { uploadAvatar } = require("../middleware/uploadmiddleware");

const {
  getAdminDesigns,
  addDesign,
  deleteDesign,
  hideCatalogDesign,
  updateDesign,   // ✅ NEW
  setAvatarUrl,
  getInquiries,
  getBookings,
  getFeedback
  ,deleteInquiry
  ,deleteBooking
  ,deleteFeedback
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

// Upload admin avatar
router.post("/avatar", verifyToken, isAdmin, uploadAvatar, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No avatar file uploaded." });

    const publicPath = `/uploads/avatars/${file.filename}`;
    await require("../database/db").getDB().query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [publicPath, req.user.id]
    );

    return res.json({ avatar: publicPath });
  } catch (error) {
    return res.status(500).json({ message: "Unable to upload avatar." });
  }
});

// Set avatar by URL (admin)
router.post("/avatar/url", verifyToken, isAdmin, setAvatarUrl);

// 📩 Get Contact Inquiries
router.get("/inquiries", verifyToken, isAdmin, getInquiries);
router.get("/bookings", verifyToken, isAdmin, getBookings);
router.get("/feedback", verifyToken, isAdmin, getFeedback);

// Delete handlers
router.delete('/inquiries/:id', verifyToken, isAdmin, deleteInquiry);
router.delete('/bookings/:id', verifyToken, isAdmin, deleteBooking);
router.delete('/feedback/:id', verifyToken, isAdmin, deleteFeedback);

module.exports = router;

// ------------------------
// TEMPORARY DEBUG ROUTES
// These bypass auth for local testing only. Remove before deploying.
// ------------------------
router.delete('/debug/design/:id', deleteDesign);
router.delete('/debug/inquiries/:id', deleteInquiry);
router.delete('/debug/bookings/:id', deleteBooking);
router.delete('/debug/feedback/:id', deleteFeedback);
