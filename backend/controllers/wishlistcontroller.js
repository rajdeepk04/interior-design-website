const wishlistModel = require("../models/wishlistmodel");

// GET wishlist (FIXED)
const getWishlistItems = async (req, res, next) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const items = await wishlistModel.getWishlistItems(userId);

    res.json(items);
  } catch (error) {
    next(error);
  }
};

// ADD wishlist
const addWishlistItem = async (req, res, next) => {
  try {
    const item = await wishlistModel.addWishlistItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// DELETE wishlist
const deleteWishlistItem = async (req, res, next) => {
  try {
    const removed = await wishlistModel.deleteWishlistItem(
      Number(req.params.id)
    );

    if (!removed) {
      return res
        .status(404)
        .json({ message: "Wishlist item not found." });
    }

    res.json({ message: "Wishlist item removed." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlistItems,
  addWishlistItem,
  deleteWishlistItem,
};