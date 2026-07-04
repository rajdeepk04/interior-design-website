const { getDB } = require("../database/db");

async function getReviews() {
  const [rows] = await getDB().query(
    `SELECT id, COALESCE(NULLIF(name, ''), user_name) AS name, email, rating, \`comment\` AS comment, page, created_at AS createdAt
     FROM reviews
     ORDER BY created_at DESC, id DESC`
  );

  return rows;
}

async function createReview(payload) {
  const name = String(payload.name || "Anonymous").trim() || "Anonymous";
  const email = String(payload.email || "").trim();
  const rating = Number(payload.rating || 5);
  const comment = String(payload.comment || "").trim();
  const page = String(payload.page || "").trim();

  const [result] = await getDB().query(
    `INSERT INTO reviews (user_name, name, email, rating, \`comment\`, page)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, name, email, Number.isFinite(rating) ? Math.min(Math.max(rating, 1), 5) : 5, comment, page]
  );

  const [rows] = await getDB().query(
    `SELECT id, COALESCE(NULLIF(name, ''), user_name) AS name, email, rating, \`comment\` AS comment, page, created_at AS createdAt
     FROM reviews
     WHERE id = ? LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
}

module.exports = {
  getReviews,
  createReview,
};
