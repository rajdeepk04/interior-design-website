const express = require("express");
const {
  getDesigns,
  getDesignById,
} = require("../controllers/designcontroller");

const router = express.Router();

router.get("/", getDesigns);
router.get("/:id", getDesignById);

module.exports = router;
