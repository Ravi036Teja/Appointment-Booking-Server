// backend/routes/bookingRoute.js

// const express = require("express");
// const router = express.Router();
// const { bookSlot, getBookedSlots, getAllBookings } = require("../controllers/bookingController"); // Correct path to your bookingController

// router.post("/book", bookSlot);
// router.get("/booked/:date", getBookedSlots);
// router.get("/", getAllBookings); // Assuming you want a route to get all bookings for admin

// module.exports = router;

// phonep setup

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Get all bookings
router.get("/", bookingController.getAllBookings);

// Get booked slots for a specific date (only paid bookings)
router.get("/booked/:date", bookingController.getBookedSlots);

// The legacy '/book' endpoint has been removed.
// All booking initiation now happens through the '/api/phonepe/pay' endpoint.

router.get("/bookings/:id", bookingController.getBookingById);

module.exports = router;