// // backend/routes/authRoutes.js
// const express = require('express');
// const router = express.Router();
// const { adminSignup, adminLogin, requestAdminOTP, adminOTPLogin } = require('../controllers/authController');

// router.post('/signup', adminSignup);
// router.post('/login', adminLogin);
// router.post('/request-otp', requestAdminOTP);
// router.post('/login-otp', adminOTPLogin);

// module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.post('/login', auth.adminLogin);
router.post('/signup', auth.adminSignup);
router.post('/send-otp', auth.requestAdminOTP);
router.post('/verify-otp', auth.verifyOTP);
router.post('/phone-login', auth.adminOTPLogin);
router.post('/reset-password-otp', auth.resetPasswordOTP);

module.exports = router;