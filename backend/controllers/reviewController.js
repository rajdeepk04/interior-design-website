const reviewModel = require("../models/reviewModel");

const getReviews = async (_req, res, next) => {
  try {
    const reviews = await reviewModel.getReviews();
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await reviewModel.createReview(req.body);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  createReview,
};
