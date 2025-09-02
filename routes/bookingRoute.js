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
const { protect } = require("../middleware/authMiddleware"); // Assuming you have this middleware

// **NEW:** Create a new booking (requires authentication)
router.post("/create", protect, bookingController.createBooking);

// Get all bookings (admin-only, but without an admin check for now)
router.get("/", bookingController.getAllBookings);

// Get booked slots for a specific date (only Paid/Pending bookings)
router.get("/booked/:date", bookingController.getBookedSlots);

// Get a single booking by ID
router.get("/:id", bookingController.getBookingById);

module.exports = router;