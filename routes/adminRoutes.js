const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// Blocked dates route
router.get("/blocked/:date", adminController.getBlockedByDate);

// Dashboard stats route
router.get("/dashboard-stats", adminController.getDashboardStats);

// Bookings aggregation routes
router.get("/bookings/daily", adminController.getDailyBookings);
router.get("/bookings/weekly", adminController.getWeeklyBookings);
router.get("/bookings/monthly", adminController.getMonthlyBookings);

module.exports = router;
