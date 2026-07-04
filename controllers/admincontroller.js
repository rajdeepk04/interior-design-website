const fs = require("fs");
const path = require("path");
const { getDB } = require("../database/db");
const designModel = require("../models/designModel");

function toPublicUploadPath(file) {
  if (!file) return "";
  return `/uploads/designs/${file.filename}`;
}

function parseGalleryInput(rawValue) {
  if (!rawValue) return [];

  if (Array.isArray(rawValue)) {
    return rawValue.filter(Boolean);
  }

  return String(rawValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectDesignPayload(req, existingDesign = null) {
  const imageFile = req.files?.image?.[0];
  const heroFile = req.files?.heroImage?.[0];
  const galleryFiles = req.files?.gallery || [];
  const existingGallery = existingDesign?.gallery || [];
  const manualGallery = parseGalleryInput(req.body.gallery);

  const image = imageFile
    ? toPublicUploadPath(imageFile)
    : (req.body.image || existingDesign?.image || "").trim();

  const heroImage = heroFile
    ? toPublicUploadPath(heroFile)
    : (req.body.heroImage || existingDesign?.heroImage || image).trim();

  const gallery = galleryFiles.length
    ? galleryFiles.map(toPublicUploadPath)
    : (manualGallery.length ? manualGallery : existingGallery.length ? existingGallery : image ? [image] : []);

  return {
    title: (req.body.title || existingDesign?.title || "").trim(),
    category: (req.body.category || existingDesign?.category || "residential").trim().toLowerCase(),
    catalogIdentity: (req.body.catalogIdentity || existingDesign?.catalogIdentity || "").trim(),
    style: (req.body.style || existingDesign?.style || "Signature Luxe").trim(),
    area: (req.body.area || existingDesign?.area || "Custom").trim(),
    timeline: (req.body.timeline || existingDesign?.timeline || "Flexible").trim(),
    year: (req.body.year || existingDesign?.year || "").trim(),
    description: (req.body.description || existingDesign?.description || "").trim(),
    longDescription: (req.body.longDescription || existingDesign?.longDescription || "").trim(),
    image,
    heroImage,
    gallery
  };
}

function removeUploadedFiles(req) {
  const files = Object.values(req.files || {}).flat();

  files.forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (_error) {
      // Ignore cleanup failures.
    }
  });
}

function removeLocalUpload(publicPath) {
  if (!publicPath || !publicPath.startsWith("/uploads/")) {
    return;
  }

  const filePath = path.join(__dirname, "..", publicPath.replace(/^\/+/, ""));

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (_error) {
      // Ignore cleanup failures.
    }
  }
}

function cleanupDesignAssets(design) {
  const paths = [design?.image, design?.heroImage, ...(design?.gallery || [])];
  [...new Set(paths.filter(Boolean))].forEach(removeLocalUpload);
}

async function getAdminDesigns(_req, res) {
  const designs = (await designModel.getAllDesigns()).filter((design) => !design.isHidden);
  res.json(designs);
}

async function addDesign(req, res) {
  try {
    const payload = collectDesignPayload(req);

    if (!payload.title || !payload.category || !payload.image) {
      removeUploadedFiles(req);
      return res.status(400).json({
        message: "Title, category, and a main image are required."
      });
    }

    const [result] = await getDB().query(
      `INSERT INTO designs
        (title, category, catalog_identity, style, area, timeline, year, image, hero_image, description, long_description, gallery, is_hidden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        payload.title,
        payload.category,
        payload.catalogIdentity || null,
        payload.style,
        payload.area,
        payload.timeline,
        payload.year,
        payload.image,
        payload.heroImage,
        payload.description,
        payload.longDescription,
        JSON.stringify(payload.gallery)
      ]
    );

    const createdDesign = await designModel.getDesignById(result.insertId);
    return res.status(201).json(createdDesign);
  } catch (_error) {
    removeUploadedFiles(req);
    return res.status(500).json({
      message: "Unable to add design."
    });
  }
}

async function updateDesign(req, res) {
  try {
    const designId = Number(req.params.id);
    const existingDesign = await designModel.getDesignById(designId);

    if (!existingDesign) {
      removeUploadedFiles(req);
      return res.status(404).json({
        message: "Design not found."
      });
    }

    const payload = collectDesignPayload(req, existingDesign);

    if (!payload.title || !payload.category || !payload.image) {
      removeUploadedFiles(req);
      return res.status(400).json({
        message: "Title, category, and a main image are required."
      });
    }

    await getDB().query(
      `UPDATE designs
       SET title = ?, category = ?, catalog_identity = ?, style = ?, area = ?, timeline = ?, year = ?,
           image = ?, hero_image = ?, description = ?, long_description = ?, gallery = ?, is_hidden = 0
       WHERE id = ?`,
      [
        payload.title,
        payload.category,
        payload.catalogIdentity || null,
        payload.style,
        payload.area,
        payload.timeline,
        payload.year,
        payload.image,
        payload.heroImage,
        payload.description,
        payload.longDescription,
        JSON.stringify(payload.gallery),
        designId
      ]
    );

    if (req.files?.image?.[0] && existingDesign.image !== payload.image) {
      removeLocalUpload(existingDesign.image);
    }

    if (req.files?.heroImage?.[0] && existingDesign.heroImage !== payload.heroImage) {
      removeLocalUpload(existingDesign.heroImage);
    }

    if ((req.files?.gallery || []).length) {
      (existingDesign.gallery || []).forEach(removeLocalUpload);
    }

    const updatedDesign = await designModel.getDesignById(designId);
    return res.json(updatedDesign);
  } catch (_error) {
    removeUploadedFiles(req);
    return res.status(500).json({
      message: "Unable to update design."
    });
  }
}

async function deleteDesign(req, res) {
  try {
    const designId = Number(req.params.id);
    const existingDesign = await designModel.getDesignById(designId);

    if (!existingDesign) {
      return res.status(404).json({
        message: "Design not found."
      });
    }

    await getDB().query("DELETE FROM designs WHERE id = ?", [designId]);
    cleanupDesignAssets(existingDesign);

    return res.json({
      message: "Design deleted successfully."
    });
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to delete design."
    });
  }
}

async function hideCatalogDesign(req, res) {
  try {
    const catalogIdentity = String(req.body?.catalogIdentity || "").trim();
    const title = String(req.body?.title || "").trim();
    const category = String(req.body?.category || "").trim().toLowerCase();

    if (!catalogIdentity || !title || !category) {
      return res.status(400).json({
        message: "Catalog identity, title, and category are required."
      });
    }

    const [rows] = await getDB().query(
      "SELECT id FROM designs WHERE catalog_identity = ? LIMIT 1",
      [catalogIdentity]
    );

    if (rows[0]?.id) {
      await getDB().query(
        `UPDATE designs
         SET title = ?, category = ?, is_hidden = 1
         WHERE id = ?`,
        [title, category, rows[0].id]
      );
    } else {
      await getDB().query(
        `INSERT INTO designs (title, category, catalog_identity, is_hidden)
         VALUES (?, ?, ?, 1)`,
        [title, category, catalogIdentity]
      );
    }

    return res.json({
      message: "Design removed from the public catalog."
    });
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to remove this design."
    });
  }
}

async function getInquiries(_req, res) {
  try {
    const [rows] = await getDB().query(
      `SELECT id, name, email, phone, subject, message, created_at AS createdAt
       FROM contact
       ORDER BY created_at DESC, id DESC`
    );

    return res.json(rows);
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to fetch inquiries."
    });
  }
}

async function getBookings(_req, res) {
  try {
    const [rows] = await getDB().query(
      `SELECT id, user_name AS name, email, project_type AS projectType,
              preferred_date AS preferredDate, time_slot AS timeSlot,
              budget, room_images AS roomImages, requirements,
              created_at AS createdAt
       FROM bookings
       ORDER BY created_at DESC, id DESC`
    );

    return res.json(rows);
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to fetch bookings."
    });
  }
}

async function getFeedback(_req, res) {
  try {
    const [rows] = await getDB().query(
      `SELECT id, COALESCE(NULLIF(name, ''), user_name) AS name, email, rating, \`comment\` AS comment, page, created_at AS createdAt
       FROM reviews
       ORDER BY created_at DESC, id DESC`
    );

    return res.json(rows);
  } catch (_error) {
    return res.status(500).json({
      message: "Unable to fetch feedback."
    });
  }
}

module.exports = {
  getAdminDesigns,
  addDesign,
  deleteDesign,
  hideCatalogDesign,
  updateDesign,
  getInquiries,
  getBookings,
  getFeedback
};
