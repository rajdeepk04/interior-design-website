const { getDB } = require("../database/db");

async function getAllDesigns() {
  const [rows] = await getDB().query(
    `SELECT id, title, category, style, area, timeline, year, image, hero_image AS heroImage,
            description, long_description AS longDescription, gallery, catalog_identity AS catalogIdentity, is_hidden AS isHidden,
            created_at AS createdAt, updated_at AS updatedAt
     FROM designs
     WHERE IFNULL(is_archived,0) = 0
     ORDER BY created_at DESC, id DESC`
  );

  return rows.map(normalizeDesignRow);
}

async function getDesignById(id) {
  const [rows] = await getDB().query(
    `SELECT id, title, category, style, area, timeline, year, image, hero_image AS heroImage,
            description, long_description AS longDescription, gallery, catalog_identity AS catalogIdentity, is_hidden AS isHidden,
            created_at AS createdAt, updated_at AS updatedAt
     FROM designs
     WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0] ? normalizeDesignRow(rows[0]) : null;
}

async function findDesignByTitleAndImage({ title, image }) {
  const [rows] = await getDB().query(
    "SELECT id, title, category, image, description FROM designs WHERE title = ? AND image <=> ? LIMIT 1",
    [title, image || null]
  );

  return rows[0] || null;
}

async function createDesign({ title, category, image, description }) {
  const [result] = await getDB().query(
    "INSERT INTO designs (title, category, image, description) VALUES (?, ?, ?, ?)",
    [title, category, image || null, description || null]
  );

  return getDesignById(result.insertId);
}

function normalizeDesignRow(row) {
  let gallery = [];

  if (Array.isArray(row.gallery)) {
    gallery = row.gallery;
  } else if (typeof row.gallery === "string" && row.gallery.trim()) {
    try {
      gallery = JSON.parse(row.gallery);
    } catch (_error) {
      gallery = [];
    }
  }

  if (!gallery.length && row.image) {
    gallery = [row.image];
  }

  return {
    ...row,
    gallery
  };
}

module.exports = {
  getAllDesigns,
  getDesignById,
  findDesignByTitleAndImage,
  createDesign,
};

async function getPaginatedDesigns({ page = 1, perPage = 12, q = "" } = {}) {
  const db = getDB();
  const offset = (Math.max(1, Number(page)) - 1) * Number(perPage || 12);
  const params = [];
  let where = "WHERE is_hidden = 0 AND IFNULL(is_archived,0) = 0";

  if (q && String(q).trim()) {
    const like = `%${String(q).trim()}%`;
    where += " AND (title LIKE ? OR category LIKE ? OR style LIKE ? OR description LIKE ?)";
    params.push(like, like, like, like);
  }

  const [rows] = await db.query(
    `SELECT id, title, category, style, area, timeline, year, image, hero_image AS heroImage,
            description, long_description AS longDescription, gallery, catalog_identity AS catalogIdentity, is_hidden AS isHidden,
            created_at AS createdAt, updated_at AS updatedAt
     FROM designs
     ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage || 12), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM designs ${where}`,
    params
  );

  return {
    data: rows.map(normalizeDesignRow),
    total: Number(total || 0),
    page: Number(page),
    perPage: Number(perPage)
  };
}

module.exports.getPaginatedDesigns = getPaginatedDesigns;
