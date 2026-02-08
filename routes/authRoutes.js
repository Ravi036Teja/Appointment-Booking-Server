// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const auth = require('../controllers/authController');

// router.post('/login', auth.adminLogin);
// router.post('/signup', auth.adminSignup);
// router.post('/send-otp', auth.requestAdminOTP);
// router.post('/verify-otp', auth.verifyOTP);
// router.post('/phone-login', auth.adminOTPLogin);
// router.post('/reset-password-otp', auth.resetPasswordOTP);

// module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

/**
 * @route   POST /api/auth/login
 * @desc    Standard email/password login
 */
router.post('/login', auth.adminLogin);

/**
 * @route   POST /api/auth/signup
 * @desc    Standard admin registration
 */
router.post('/signup', auth.adminSignup);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Request OTP for Login, Signup, or Forgot Password (via Direct Firebase)
 */
router.post('/send-otp', auth.requestAdminOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for registration validation
 */
router.post('/verify-otp', auth.verifyOTP);

/**
 * @route   POST /api/auth/phone-login
 * @desc    Login using phone number and OTP
 */
router.post('/phone-login', auth.adminOTPLogin);

/**
 * @route   POST /api/auth/reset-password-otp
 * @desc    Reset password after verifying OTP
 */
router.post('/reset-password-otp', auth.resetPasswordOTP);

module.exports = router;