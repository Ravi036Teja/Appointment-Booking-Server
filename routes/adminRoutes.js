// const express = require("express");
// const router = express.Router();
// const {
//   getHolidays,
//   addHoliday,
//   deleteHoliday,
//   getBlockedByDate, 
//   getDashboardStats,
//   // ✅ newly added
// } = require("../controllers/adminController");

// router.get("/holidays", getHolidays);
// router.post("/holidays", addHoliday);
// router.delete("/holidays/:date", deleteHoliday);
// // router.post("/holidays/range", addHolidayRange);
// // ✅ New route for fetching blocked info by date
// router.get("/blocked/:date", getBlockedByDate);
// router.get("/dashboard-stats", getDashboardStats);
// module.exports = router;

// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getHolidays,
  addHoliday,
  deleteHoliday,
  getBlockedByDate,
  getDashboardStats,
  // Make sure these are imported correctly from adminController
  getDailyBookingsChart,
  getWeeklyBookingsChart,
  getMonthlyBookingsChart,
} = require("../controllers/adminController"); // Path might need adjustment depending on your exact folder structure

router.get("/holidays", getHolidays);
router.post("/holidays", addHoliday);
router.delete("/holidays/:date", deleteHoliday);
router.get("/blocked/:date", getBlockedByDate);
router.get("/dashboard-stats", getDashboardStats);

// THESE ARE THE ROUTES FOR YOUR CHARTS - ENSURE THEY ARE EXACTLY AS BELOW
router.get("/bookings/daily", getDailyBookingsChart);
router.get("/bookings/weekly", getWeeklyBookingsChart);
router.get("/bookings/monthly", getMonthlyBookingsChart);

module.exports = router;