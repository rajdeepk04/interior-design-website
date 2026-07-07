const { getDB } = require("../database/db");
const userModel = require("./usermodel");
const designModel = require("./designModel");

async function resolveUserId(payload) {
  const explicitUserId = Number(payload.userId || payload.user_id);

  if (explicitUserId) {
    return explicitUserId;
  }

  const email = payload.userEmail || payload.email || null;
  if (!email) {
    return null;
  }

  const user = await userModel.findUserByEmail(email);
  return user?.id || null;
}

async function resolveDesignId(payload) {
  const explicitDesignId = Number(payload.designId || payload.design_id);

  if (explicitDesignId) {
    return explicitDesignId;
  }

  const existingDesign = await designModel.findDesignByTitleAndImage({
    title: payload.title || "Untitled Design",
    image: payload.image || null,
  });

  if (existingDesign) {
    return existingDesign.id;
  }

  const createdDesign = await designModel.createDesign({
    title: payload.title || "Untitled Design",
    category: payload.category || "general",
    image: payload.image || null,
    description: payload.description || null,
  });

  return createdDesign?.id || null;
}

async function getWishlistItems(userId) {
  const [rows] = await getDB().query(
    `SELECT
      w.id,
      w.user_id AS userId,
      w.design_id AS designId,
      d.title,
      d.category,
      d.image,
      d.description,
      w.created_at AS createdAt
     FROM wishlist w
     LEFT JOIN designs d ON w.design_id = d.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return rows;
}

async function addWishlistItem(payload) {
  const userId = await resolveUserId(payload);
  const designId = await resolveDesignId(payload);

  const [existingRows] = await getDB().query(
    "SELECT id FROM wishlist WHERE user_id <=> ? AND design_id <=> ? LIMIT 1",
    [userId, designId]
  );

  if (existingRows[0]) {
    const [rows] = await getDB().query(
      `SELECT
        wishlist.id,
        wishlist.user_id AS userId,
        wishlist.design_id AS designId,
        users.email AS userEmail,
        designs.title,
        designs.category,
        designs.image,
        designs.description,
        wishlist.created_at AS createdAt
       FROM wishlist
       LEFT JOIN users ON wishlist.user_id = users.id
       LEFT JOIN designs ON wishlist.design_id = designs.id
       WHERE wishlist.id = ? LIMIT 1`,
      [existingRows[0].id]
    );

    return rows[0] || null;
  }

  const [result] = await getDB().query(
    "INSERT INTO wishlist (user_id, design_id) VALUES (?, ?)",
    [userId, designId]
  );

  const [rows] = await getDB().query(
    `SELECT
      wishlist.id,
      wishlist.user_id AS userId,
      wishlist.design_id AS designId,
      users.email AS userEmail,
      designs.title,
      designs.category,
      designs.image,
      designs.description,
      wishlist.created_at AS createdAt
     FROM wishlist
     LEFT JOIN users ON wishlist.user_id = users.id
     LEFT JOIN designs ON wishlist.design_id = designs.id
     WHERE wishlist.id = ? LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
}

async function deleteWishlistItem(id) {
  const [result] = await getDB().query(
    "DELETE FROM wishlist WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getWishlistItems,
  addWishlistItem,
  deleteWishlistItem,
};
