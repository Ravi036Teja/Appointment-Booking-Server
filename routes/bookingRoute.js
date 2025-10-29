// module.exports = router;
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect } = require('../middleware/authMiddleware');

// Get all bookings (protected)
router.get("/", protect, bookingController.getAllBookings);

// Get booked slots for a specific date
router.get("/booked/:date", bookingController.getBookedSlots);

// ✅ Move this route ABOVE the `/:id` route to avoid conflict
router.get("/merchant/:merchantOrderId", bookingController.getBookingByMerchantOrderId);

// Get a single booking by ID (protected)
router.get("/:id", protect, bookingController.getBookingById);

// Refund route (protected)
router.patch("/:bookingId/refund", protect, bookingController.updateRefundStatus);

module.exports = router;
