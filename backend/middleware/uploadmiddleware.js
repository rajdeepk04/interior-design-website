const fs = require("fs");
const path = require("path");
const multer = require("multer");

function createStorage(folderName, fallbackBaseName) {
  const uploadDirectory = path.join(__dirname, "..", "uploads", folderName);
  fs.mkdirSync(uploadDirectory, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDirectory);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      const baseName = path
        .basename(file.originalname || fallbackBaseName, extension)
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      callback(null, `${baseName || fallbackBaseName}-${Date.now()}${extension || ".jpg"}`);
    }
  });
}

function fileFilter(_req, file, callback) {
  if ((file.mimetype || "").startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image uploads are allowed."));
}

const uploadDesignImages = multer({
  storage: createStorage("designs", "design"),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).fields([
  { name: "image", maxCount: 1 },
  { name: "heroImage", maxCount: 1 },
  { name: "gallery", maxCount: 6 }
]);

const uploadBookingImages = multer({
  storage: createStorage("bookings", "booking-room"),
  fileFilter,
  limits: {
    fileSize: 12 * 1024 * 1024
  }
}).array("roomImages", 6);

const uploadAvatar = multer({
  storage: createStorage("avatars", "avatar"),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
}).single("avatar");

module.exports = {
  uploadDesignImages,
  uploadBookingImages,
  uploadAvatar
};
