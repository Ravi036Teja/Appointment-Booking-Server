// backend/controllers/authController.js
const AdminUser = require('../models/AdminUser');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // Ensure process.env.JWT_SECRET is defined
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables!');
    throw new Error('Server configuration error: JWT secret missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // A more practical expiration for an admin token
  });
};

exports.adminSignup = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }
  try {
    let user = await AdminUser.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    // Password hashing handled by pre-save hook in model
    user = await AdminUser.create({ email, password });

    res.status(201).json({
      message: 'Admin user registered successfully',
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error during admin signup:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server error during signup', details: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }
  try {
    // CRUCIAL: Since password now has `select: false` in the model,
    // we must explicitly select it here to be able to compare.
    const user = await AdminUser.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // `user.password` will now contain the hashed password due to `.select('+password')`
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Do not send password in the response, even if it's hashed
    res.json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    // Provide more details in the server error message for debugging
    res.status(500).json({ message: 'Server error during login', details: error.message });
  }
};