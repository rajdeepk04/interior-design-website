const { getDB } = require("../database/db");

// GET messages
const getMessages = async () => {
  const db = getDB();

  const [rows] = await db.query(
    "SELECT * FROM contact ORDER BY created_at DESC"
  );

  return rows;
};

// CREATE message
const createMessage = async (payload) => {
  const db = getDB();

  const [result] = await db.query(
    "INSERT INTO contact (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
    [
      payload.name || "Guest",
      payload.email || "",
      payload.phone || "",
      payload.subject || "",
      payload.message || ""
    ]
  );

  return {
    id: result.insertId,
    ...payload
  };
};

module.exports = {
  getMessages,
  createMessage,
};
