// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const User = require('../models/Users.Model'); 

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
// ✅ Middleware for User Protection
const userProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ✅ Find the user in the regular User model
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) {
//       // No token found, proceed to next middleware/route handler
//       // This allows guest users (from the website) to continue
//       return next();
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({ _id: decoded.id });

//     if (!user) {
//       throw new Error();
//     }

//     req.token = token;
//     req.user = user;
//     next();
//   } catch (e) {
//     // If the token is invalid, unauthorized, or user not found
//     console.error("Authentication failed:", e.message);
//     res.status(401).send({ error: "Please authenticate." });
//   }
// };


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // If no token is provided, it's a guest user (from the website).
        // The check below ensures that if no token exists, the request is allowed to pass through.
        if (!token) {
            console.log("No token provided. Proceeding as guest.");
            return next();
        }

        // A token is provided (App user). Verify and find the user.
        console.log("Token provided. Attempting to authenticate user.");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the user in the database using the ID from the token.
        // This line is now correct and will find the user from the app.
        const user = await User.findOne({ _id: decoded.id });

        if (!user) {
            // If a token was provided but the user doesn't exist, it's an invalid token.
            console.error("Authentication failed: User not found for token.");
            return res.status(401).send({ error: "User not found." });
        }

        // Authentication successful. Attach the user to the request object.
        req.user = user;
        next();
    } catch (e) {
        // This catch block will only run if the token is invalid (e.g., expired, malformed).
        console.error("Authentication failed:", e.message);
        res.status(401).send({ error: "Please authenticate." });
    }
};

module.exports = { protect, userProtect, auth };

// module.exports = { protect /*, authorize */ };

