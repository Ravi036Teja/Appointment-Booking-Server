// const express = require("express");
// const router = express.Router();
// const bookingController = require("../controllers/bookingController");

// // Get all bookings
// router.get("/", bookingController.getAllBookings);

// // Get booked slots for a specific date (only Paid/Pending bookings)
// router.get("/booked/:date", bookingController.getBookedSlots);

// // Get a single booking by ID
// router.get("/:id", bookingController.getBookingById);

// module.exports = router;
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect } = require('../middleware/authMiddleware');

// Get all bookings with optional filters (e.g., today)
// This route is now protected to be accessible only by an authenticated admin
router.get("/", protect, bookingController.getAllBookings);

// Get booked slots for a specific date (only Paid/Pending bookings)
router.get("/booked/:date", bookingController.getBookedSlots);

// Get a single booking by ID
router.get("/:id", protect, bookingController.getBookingById);

module.exports = router;