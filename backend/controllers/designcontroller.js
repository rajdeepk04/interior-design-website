const designModel = require("../models/designModel");

const getDesigns = async (_req, res, next) => {
  try {
    const designs = await designModel.getAllDesigns();
    res.json(designs);
  } catch (error) {
    next(error);
  }
};

const getDesignById = async (req, res, next) => {
  try {
    const design = await designModel.getDesignById(Number(req.params.id));

    if (!design) {
      return res.status(404).json({ message: "Design not found." });
    }

    return res.json(design);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesigns,
  getDesignById,
};
