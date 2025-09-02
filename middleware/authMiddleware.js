// // backend/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
// const AdminUser = require('../models/AdminUser');

// const protect = async (req, res, next) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       // Get token from header
//       token = req.headers.authorization.split(' ')[1];

//       // Verify token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Attach user to the request object (excluding password)
//       req.user = await AdminUser.findById(decoded.id).select('-password');
//       if (!req.user) {
//         return res.status(401).json({ message: 'Not authorized, user not found' });
//       }

//       next(); // Proceed to the next middleware/route handler
//     } catch (error) {
//       console.error('Token verification error:', error);
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

// // Middleware to check for admin role (optional, if you implement roles)
// // const authorize = (roles = []) => {
// //   if (typeof roles === 'string') {
// //     roles = [roles];
// //   }

// //   return (req, res, next) => {
// //     if (!roles.includes(req.user.role)) {
// //       return res.status(403).json({ message: 'Not authorized to access this route' });
// //     }
// //     next();
// //   };
// // };

// module.exports = { protect /*, authorize */ };


// const jwt = require('jsonwebtoken');
// const User = require('../models/Users.Model'); // Correct path for your regular User model
// const AdminUser = require('../models/AdminUser'); // Correct path for your AdminUser model

// // This middleware checks for a valid JWT and attaches the authenticated user to the request object.
// const protect = async (req, res, next) => {
//     let token;

//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         try {
//             // Get token from header
//             token = req.headers.authorization.split(' ')[1];

//             // Verify token using your secret key
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             // Attempt to find the user in the AdminUser model first
//             let user = await AdminUser.findById(decoded.id).select('-password');

//             // If not found as an admin, attempt to find the user in the regular User model
//             if (!user) {
//                 user = await User.findById(decoded.id).select('-password');
//             }

//             // If a user is found in either model, attach it to the request
//             if (user) {
//                 req.user = user;
//                 next(); // Proceed to the next middleware or route handler
//             } else {
//                 return res.status(401).json({ message: 'Not authorized, user not found' });
//             }
//         } catch (error) {
//             console.error('Token verification error:', error);
//             return res.status(401).json({ message: 'Not authorized, token failed' });
//         }
//     }

//     if (!token) {
//         return res.status(401).json({ message: 'Not authorized, no token' });
//     }
// };

// // This middleware checks if the authenticated user has the 'admin' role.
// const admin = (req, res, next) => {
//     if (req.user && req.user.role === 'admin') {
//         next(); // User has the 'admin' role, proceed
//     } else {
//         res.status(403).json({ message: 'Access denied. Admin role required.' });
//     }
// };

// // Export both middleware functions for use in your routes
// module.exports = { protect, admin };

// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users.Model'); // Correct path for your regular User model
const AdminUser = require('../models/AdminUser'); // Correct path for your AdminUser model

// This middleware checks for a valid JWT and attaches the authenticated user to the request object.
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attempt to find the user in the AdminUser model first
            let user = await AdminUser.findById(decoded.id).select('-password');

            // If not found as an admin, attempt to find the user in the regular User model
            if (!user) {
                user = await User.findById(decoded.id).select('-password');
            }

            // If a user is found in either model, attach it to the request
            if (user) {
                req.user = user;
                next(); // Proceed to the next middleware or route handler
            } else {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// This middleware checks if the authenticated user has the 'admin' role.
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User has the 'admin' role, proceed
    } else {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
};

// Export both middleware functions for use in your routes
module.exports = { protect, admin };