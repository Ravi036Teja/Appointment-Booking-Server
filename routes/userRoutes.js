const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/userController');
const router = express.Router();

// ✅ Add this line to import the protect middleware
const { userProtect } = require('../middleware/authMiddleware'); 

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', userProtect, getProfile);

module.exports = router;