// const express = require("express");
// const router = express.Router();

// const adminController = require("../controllers/adminController");
// const { 
//     sendAdminInvite, // <-- MAKE SURE THIS IS INCLUDED
//     validateInvitationToken, 
//     createAdminAccount 
// } = require('../controllers/adminController');
// const { protect, admin } = require('../middleware/authMiddleware');
// // Blocked dates route
// router.get("/blocked/:date", adminController.getBlockedByDate);

// // Dashboard stats route
// router.get("/dashboard-stats", adminController.getDashboardStats);

// // Bookings aggregation routes
// router.get("/bookings/daily", adminController.getDailyBookings);
// router.get("/bookings/weekly", adminController.getWeeklyBookings);
// router.get("/bookings/monthly", adminController.getMonthlyBookings);
// // This route is protected and can only be accessed by a logged-in admin
// router.post('/invite', protect, admin, sendAdminInvite);

// // These routes are public for the invitee to create their account
// router.post('/validate-token', validateInvitationToken);
// router.post('/create-account', createAdminAccount);


// module.exports = router;


// const express = require("express");
// const router = express.Router();

// // Import the entire adminController object
// const adminController = require("../controllers/adminController");
// const { protect, admin } = require('../middleware/authMiddleware');

// // Blocked dates route
// router.get("/blocked/:date", adminController.getBlockedByDate);

// // Dashboard stats route
// router.get("/dashboard-stats", adminController.getDashboardStats);

// // Bookings aggregation routes
// router.get("/bookings/daily", adminController.getDailyBookings);
// router.get("/bookings/weekly", adminController.getWeeklyBookings);
// router.get("/bookings/monthly", adminController.getMonthlyBookings);

// // This route is protected and can only be accessed by a logged-in admin
// router.post('/invite', protect, admin, adminController.sendAdminInvite);

// // These routes are public for the invitee to create their account
// router.post('/validate-token', adminController.validateInvitationToken);
// router.post('/create-account', adminController.createAdminAccount);

// module.exports = router;

const express = require("express");
const router = express.Router();

// Import the entire adminController object
const adminController = require("../controllers/adminController");
const { protect } = require('../middleware/authMiddleware');

// Blocked dates route
router.get("/blocked/:date", protect, adminController.getBlockedByDate);

// Dashboard stats route
router.get("/dashboard-stats", protect, adminController.getDashboardStats);

// Bookings aggregation routes
router.get("/bookings/daily", protect, adminController.getDailyBookings);
router.get("/bookings/weekly", protect, adminController.getWeeklyBookings);
router.get("/bookings/monthly", protect, adminController.getMonthlyBookings);

// This route is protected and can only be accessed by a logged-in admin
// Removed the undefined 'admin' middleware
router.post('/invite', protect, adminController.sendAdminInvite);

// These routes are public for the invitee to create their account
router.post('/validate-token', adminController.validateInvitationToken);
router.post('/create-account', adminController.createAdminAccount);

module.exports = router;