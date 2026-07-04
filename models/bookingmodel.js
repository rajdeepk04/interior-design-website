const { getDB } = require("../database/db");

async function getBookings() {

  const db = getDB();

  const [rows] = await db.query(
    `SELECT
      id,
      user_name AS name,
      email,
      project_type AS projectType,
      preferred_date AS preferredDate,
      time_slot AS timeSlot,
      budget,
      room_images AS roomImages,
      requirements,
      created_at AS createdAt
    FROM bookings
    ORDER BY created_at DESC`
  );

  return rows;
}

async function createBooking(payload) {

  const db = getDB();

  const name = payload.name || payload.user_name || "Guest";
  const email = payload.email || "";
  const projectType =
    payload.projectType ||
    payload.project_type ||
    "consultation";

  const preferredDate =
    payload.preferredDate ||
    payload.preferred_date ||
    null;

  const timeSlot =
    payload.timeSlot ||
    payload.time_slot ||
    null;

  const budget = payload.budget || null;

  const roomImages = Array.isArray(payload.roomImages)
    ? payload.roomImages.filter(Boolean).join(", ")
    : payload.roomImages || null;

  const requirements =
    payload.requirements ||
    payload.notes ||
    null;

  const [result] = await db.query(
    `INSERT INTO bookings
      (user_name, email, project_type, preferred_date,
       time_slot, budget, room_images, requirements)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      projectType,
      preferredDate,
      timeSlot,
      budget,
      roomImages,
      requirements
    ]
  );

  const [rows] = await db.query(
    `SELECT
      id,
      user_name AS name,
      email,
      project_type AS projectType,
      preferred_date AS preferredDate,
      time_slot AS timeSlot,
      budget,
      room_images AS roomImages,
      requirements,
      created_at AS createdAt
     FROM bookings
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
}

module.exports = {
  getBookings,
  createBooking
};
