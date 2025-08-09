

// const express = require("express");
// const router = express.Router();
// const bookingController = require("../controllers/bookingController");

// // Get all bookings
// router.get("/", bookingController.getAllBookings);

// // Get booked slots for a specific date (only paid bookings)
// router.get("/booked/:date", bookingController.getBookedSlots);

// // The legacy '/book' endpoint has been removed.
// // All booking initiation now happens through the '/api/phonepe/pay' endpoint.

// router.get("/bookings/:id", bookingController.getBookingById);

// module.exports = router;

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Get all bookings
router.get("/", bookingController.getAllBookings);

// Get booked slots for a specific date (only Paid/Pending bookings)
router.get("/booked/:date", bookingController.getBookedSlots);

// Get a single booking by ID
router.get("/:id", bookingController.getBookingById);

module.exports = router;
