const User = require('../models/Users.Model');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/users/signup
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const user = await User.create({ name, email, password, phone });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }
  
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone, // Include phone in login response
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




// @desc    Get user profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  if (req.user) {
    try {
      // ✅ Populate the 'bookings' field with actual booking documents
      const user = await User.findById(req.user._id).populate('bookings');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Now `user.bookings` contains the full booking objects
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bookings: user.bookings, // ✅ This will now include all user bookings
      });
    } catch (error) {
      console.error("Error fetching user profile with bookings:", error);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, user not found' });
  }
};

module.exports = { registerUser, loginUser , getProfile};