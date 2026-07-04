const express = require("express");
const {
  getWishlistItems,
  addWishlistItem,
  deleteWishlistItem,
} = require("../controllers/wishlistcontroller");

const router = express.Router();

router.get("/", getWishlistItems);
router.post("/", addWishlistItem);
router.delete("/:id", deleteWishlistItem);

module.exports = router;
