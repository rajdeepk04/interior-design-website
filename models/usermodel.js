const { getDB } = require("../database/db");

/* =========================
   FIND USER BY EMAIL
========================= */
async function findUserByEmail(email) {

  const db = getDB();

  const [rows] = await db.query(
    `SELECT id, name, email, password, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}


/* =========================
   CREATE USER
========================= */
async function createUser({ name, email, password }) {

  const db = getDB();

  const [result] = await db.query(
    `INSERT INTO users (name, email, password)
     VALUES (?, ?, ?)`,
    [name, email, password]
  );

  const [rows] = await db.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
}


/* =========================
   UPDATE LAST LOGIN
========================= */
async function updateLastLogin(userId) {

  const db = getDB();

  await db.query(
    `UPDATE users
     SET last_login_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId]
  );

  const [rows] = await db.query(
    `SELECT id, name, email, last_login_at, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}


/* =========================
   SAVE RESET TOKEN (FIXED)
========================= */
async function saveResetToken(email, token, expiry) {

  const db = getDB();

  try {

    const [result] = await db.query(
      `UPDATE users
       SET reset_token = ?,
           reset_token_expiry = ?
       WHERE email = ?`,
      [token, expiry, email]
    );

    // DEBUG LOG (VERY IMPORTANT)
    console.log("Reset token saved:", result.affectedRows);

    return result;

  } catch (err) {
    console.error("❌ saveResetToken DB error:", err);
    throw err;
  }
}


/* =========================
   FIND USER BY RESET TOKEN
========================= */
async function findUserByResetToken(token) {

  const db = getDB();

  const [rows] = await db.query(
    `SELECT *
     FROM users
     WHERE reset_token = ?
       AND reset_token_expiry > NOW()
     LIMIT 1`,
    [token]
  );

  return rows[0] || null;
}


/* =========================
   UPDATE PASSWORD (FIXED SAFETY)
========================= */
async function updatePassword(token, password) {

  const db = getDB();

  const [result] = await db.query(
    `UPDATE users
     SET password = ?,
         reset_token = NULL,
         reset_token_expiry = NULL
     WHERE reset_token = ?`,
    [password, token]
  );

  console.log("Password updated rows:", result.affectedRows);

  return result;
}


/* =========================
   EXPORTS
========================= */
module.exports = {
  findUserByEmail,
  createUser,
  updateLastLogin,
  saveResetToken,
  findUserByResetToken,
  updatePassword,
};