// // backend/controllers/authController.js
// const AdminUser = require('../models/AdminUser');
// const jwt = require('jsonwebtoken');
// const { Expo } = require("expo-server-sdk");
// const expo = new Expo();

// const generateToken = (id) => {
//   // Ensure process.env.JWT_SECRET is defined
//   if (!process.env.JWT_SECRET) {
//     console.error('JWT_SECRET is not defined in environment variables!');
//     throw new Error('Server configuration error: JWT secret missing.');
//   }
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: '30d', // A more practical expiration for an admin token
//   });
// };


// // 1. Request OTP
// exports.requestAdminOTP = async (req, res) => {
//     const { phone, expoPushToken } = req.body;
//     try {
//         const admin = await AdminUser.findOne({ phone });
//         if (!admin) return res.status(404).json({ message: "Admin not found" });

//         // Generate 6 digit OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         admin.otp = otp;
//         admin.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
//         admin.expoPushToken = expoPushToken; // Update token if it changed
//         await admin.save();

//         // Send via Expo Notification
//         if (!Expo.isExpoPushToken(expoPushToken)) {
//             return res.status(400).json({ message: "Invalid Expo Push Token" });
//         }

//         await expo.sendPushNotificationsAsync([{
//             to: expoPushToken,
//             sound: 'default',
//             title: 'Your Admin Login Code',
//             body: `Your OTP is: ${otp}`,
//             data: { otp },
//         }]);

//         res.json({ message: "OTP sent successfully to your device" });
//     } catch (error) {
//         res.status(500).json({ message: "Error sending OTP", error: error.message });
//     }
// };

// // 2. Verify OTP Login
// exports.adminOTPLogin = async (req, res) => {
//     const { phone, otp } = req.body;
//     try {
//         const admin = await AdminUser.findOne({ 
//             phone, 
//             otp, 
//             otpExpires: { $gt: Date.now() } 
//         });

//         if (!admin) return res.status(400).json({ message: "Invalid or expired OTP" });

//         // Clear OTP after use
//         admin.otp = undefined;
//         admin.otpExpires = undefined;
//         await admin.save();

//         res.json({
//             _id: admin._id,
//             email: admin.email,
//             token: generateToken(admin._id), // Reuse your existing token function
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Login error", error: error.message });
//     }
// };

// exports.adminSignup = async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: 'Please enter all fields' });
//   }
//   try {
//     let user = await AdminUser.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }
//     // Password hashing handled by pre-save hook in model
//     user = await AdminUser.create({ email, password });

//     res.status(201).json({
//       message: 'Admin user registered successfully',
//       _id: user._id,
//       email: user.email,
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     console.error('Error during admin signup:', error);
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ message: 'Validation error', errors: errors.join(', ') });
//     }
//     res.status(500).json({ message: 'Server error during signup', details: error.message });
//   }
// };

// exports.adminLogin = async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: 'Please enter all fields' });
//   }
//   try {
//     // CRUCIAL: Since password now has `select: false` in the model,
//     // we must explicitly select it here to be able to compare.
//     const user = await AdminUser.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // `user.password` will now contain the hashed password due to `.select('+password')`
//     const isMatch = await user.matchPassword(password);
    
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Do not send password in the response, even if it's hashed
//     res.json({
//       _id: user._id,
//       email: user.email,
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     console.error('Error during admin login:', error);
//     // Provide more details in the server error message for debugging
//     res.status(500).json({ message: 'Server error during login', details: error.message });
//   }
// };

const AdminUser = require('../models/AdminUser');
const jwt = require('jsonwebtoken');
const { Expo } = require("expo-server-sdk");
const expo = new Expo();

// FOR TESTING: Temporary store for OTPs for new signup numbers
// In production, you would use Redis or a separate MongoDB collection
const signupOTPs = new Map(); 

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error: JWT secret missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. Request OTP (Login, Signup, or Forgot Password)
exports.requestAdminOTP = async (req, res) => {
    const { phone, expoPushToken, type } = req.body;
    try {
        let admin = await AdminUser.findOne({ phone });

        if (type === 'signup') {
            if (admin) return res.status(400).json({ message: "Phone number already registered" });

            // Create OTP for new number
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            signupOTPs.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });

            console.log(`\n--- [SIGNUP] OTP for ${phone}: ${otp} ---\n`);

            // Send push notification if token is provided
            if (expoPushToken && Expo.isExpoPushToken(expoPushToken)) {
                try {
                    await expo.sendPushNotificationsAsync([{
                        to: expoPushToken,
                        sound: 'default',
                        title: 'Your OTP Code',
                        body: `Your verification code is: ${otp}`,
                        data: { otp, type: 'signup' },
                        priority: 'high',
                    }]);
                    console.log(`✅ Push notification sent to ${expoPushToken}`);
                } catch (pushError) {
                    console.error('❌ Push notification failed:', pushError);
                }
            } else {
                console.log('⚠️ No valid push token provided');
            }

            return res.json({ message: "OTP sent (Check your device)" });
        }

        if (!admin) {
            return res.status(404).json({ message: "No account found with this phone number" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.otp = otp;
        admin.otpExpires = Date.now() + 10 * 60 * 1000;
        await admin.save();

        console.log(`\n--- [${type.toUpperCase()}] OTP for ${admin.email}: ${otp} ---\n`);

        // Send push notification if token is provided
        if (expoPushToken && Expo.isExpoPushToken(expoPushToken)) {
            try {
                await expo.sendPushNotificationsAsync([{
                    to: expoPushToken,
                    sound: 'default',
                    title: 'Your OTP Code',
                    body: `Your verification code is: ${otp}`,
                    data: { otp, type },
                    priority: 'high',
                }]);
                console.log(`✅ Push notification sent to ${expoPushToken}`);
            } catch (pushError) {
                console.error('❌ Push notification failed:', pushError);
            }
        } else {
            console.log('⚠️ No valid push token provided');
        }

        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 2. Verify OTP (For the Signup Screen 'Verify' button)
exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const stored = signupOTPs.get(phone);
        if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        // Success
        res.json({ message: "Verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Verification error" });
    }
};

// 3. Phone OTP Login
exports.adminOTPLogin = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const admin = await AdminUser.findOne({ 
            phone, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!admin) return res.status(400).json({ message: "Invalid or expired OTP" });

        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();

        res.json({
            _id: admin._id,
            email: admin.email,
            phone: admin.phone,
            token: generateToken(admin._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
};

// 4. Reset Password via OTP
exports.resetPasswordOTP = async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    try {
        const admin = await AdminUser.findOne({ 
            phone, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        }).select('+password');

        if (!admin) return res.status(400).json({ message: "Invalid or expired OTP" });

        admin.password = newPassword;
        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Reset error" });
    }
};

// 5. Standard Signup (Final Step)
exports.adminSignup = async (req, res) => {
    const { email, password, phone } = req.body;
    if (!email || !password || !phone) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }
    try {
        let user = await AdminUser.findOne({ $or: [{ email }, { phone }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = await AdminUser.create({ email, password, phone });
        signupOTPs.delete(phone); // Clear signup memory

        res.status(201).json({
            _id: user._id,
            email: user.email,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during signup', details: error.message });
    }
};

// 6. Standard Email Login
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await AdminUser.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            email: user.email,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};