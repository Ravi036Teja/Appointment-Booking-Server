const express = require("express");
const router = express.Router();
const {
  getHolidays,
  addHoliday,
  deleteHoliday,
  getBlockedByDate, 
  getDashboardStats,
  // ✅ newly added
} = require("../controllers/adminController");

router.get("/holidays", getHolidays);
router.post("/holidays", addHoliday);
router.delete("/holidays/:date", deleteHoliday);
// router.post("/holidays/range", addHolidayRange);
// ✅ New route for fetching blocked info by date
router.get("/blocked/:date", getBlockedByDate);
router.get("/dashboard-stats", getDashboardStats);
module.exports = router;
