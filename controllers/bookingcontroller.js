const bookingModel = require("../models/bookingmodel");

// Get all bookings
const getBookings = async (_req, res, next) => {
  try {
    const bookings = await bookingModel.getBookings();
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// Create new booking
const createBooking = async (req, res, next) => {
  try {
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/bookings/${file.filename}`)
      : [];
    const booking = await bookingModel.createBooking({
      ...req.body,
      roomImages: uploadedImages.length ? uploadedImages : req.body.roomImages
    });
    res.status(201).json({
      message: "Booking saved successfully",
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
};
