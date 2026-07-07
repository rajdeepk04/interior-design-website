const express = require("express");
const {getBookings,createBooking,} = require("../controllers/bookingcontroller");
const { uploadBookingImages } = require("../middleware/uploadmiddleware");

const router = express.Router();

router.get("/", getBookings);
router.post("/", uploadBookingImages, createBooking);

module.exports = router;
