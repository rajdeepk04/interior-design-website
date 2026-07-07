const designModel = require("../models/designModel");

const getDesigns = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 12);
    const q = req.query.q || "";

    const result = await designModel.getPaginatedDesigns({ page, perPage, q });
    res.json(result);
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
