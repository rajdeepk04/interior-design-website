const { getDB } = require("../database/db");

async function getAllDesigns() {
  const [rows] = await getDB().query(
    `SELECT id, title, category, style, area, timeline, year, image, hero_image AS heroImage,
            description, long_description AS longDescription, gallery, catalog_identity AS catalogIdentity, is_hidden AS isHidden,
            created_at AS createdAt, updated_at AS updatedAt
     FROM designs
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
