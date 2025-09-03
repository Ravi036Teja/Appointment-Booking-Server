// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to the request object (excluding password)
      req.user = await AdminUser.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check for admin role (optional, if you implement roles)
// const authorize = (roles = []) => {
//   if (typeof roles === 'string') {
//     roles = [roles];
//   }

//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Not authorized to access this route' });
//     }
//     next();
//   };
// };

// const admin = (req, res, next) => {
//     if (req.user && req.user.role === 'admin') {
//         next(); // User has the 'admin' role, proceed
//     } else {
//         res.status(403).json({ message: 'Access denied. Admin role required.' });
//     }
// };

module.exports = { protect /*, authorize */ };

