// const AdminUser = require('../models/AdminUser');
// const jwt = require('jsonwebtoken');
// const { Expo } = require("expo-server-sdk");
// const expo = new Expo();

// // FOR TESTING: Temporary store for OTPs for new signup numbers
// // In production, you would use Redis or a separate MongoDB collection
// const signupOTPs = new Map(); 

// const generateToken = (id) => {
//   if (!process.env.JWT_SECRET) {
//     throw new Error('Server configuration error: JWT secret missing.');
//   }
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // 1. Request OTP (Login, Signup, or Forgot Password)
// exports.requestAdminOTP = async (req, res) => {
//     const { phone, expoPushToken, type } = req.body;
//     try {
//         let admin = await AdminUser.findOne({ phone });

//         if (type === 'signup') {
//             if (admin) return res.status(400).json({ message: "Phone number already registered" });

//             // Create OTP for new number
//             const otp = Math.floor(100000 + Math.random() * 900000).toString();
//             signupOTPs.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });

//             console.log(`\n--- [SIGNUP] OTP for ${phone}: ${otp} ---\n`);

//             // Send push notification if token is provided
//             if (expoPushToken && Expo.isExpoPushToken(expoPushToken)) {
//                 try {
//                     await expo.sendPushNotificationsAsync([{
//                         to: expoPushToken,
//                         sound: 'default',
//                         title: 'Your OTP Code',
//                         body: `Your verification code is: ${otp}`,
//                         data: { otp, type: 'signup' },
//                         priority: 'high',
//                     }]);
//                     console.log(`✅ Push notification sent to ${expoPushToken}`);
//                 } catch (pushError) {
//                     console.error('❌ Push notification failed:', pushError);
//                 }
//             } else {
//                 console.log('⚠️ No valid push token provided');
//             }

//             return res.json({ message: "OTP sent (Check your device)" });
//         }

//         if (!admin) {
//             return res.status(404).json({ message: "No account found with this phone number" });
//         }

//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         admin.otp = otp;
//         admin.otpExpires = Date.now() + 10 * 60 * 1000;
//         await admin.save();

//         console.log(`\n--- [${type.toUpperCase()}] OTP for ${admin.email}: ${otp} ---\n`);

//         // Send push notification if token is provided
//         if (expoPushToken && Expo.isExpoPushToken(expoPushToken)) {
//             try {
//                 await expo.sendPushNotificationsAsync([{
//                     to: expoPushToken,
//                     sound: 'default',
//                     title: 'Your OTP Code',
//                     body: `Your verification code is: ${otp}`,
//                     data: { otp, type },
//                     priority: 'high',
//                 }]);
//                 console.log(`✅ Push notification sent to ${expoPushToken}`);
//             } catch (pushError) {
//                 console.error('❌ Push notification failed:', pushError);
//             }
//         } else {
//             console.log('⚠️ No valid push token provided');
//         }

//         res.json({ message: "OTP sent successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Error", error: error.message });
//     }
// };

// // 2. Verify OTP (For the Signup Screen 'Verify' button)
// exports.verifyOTP = async (req, res) => {
//     const { phone, otp } = req.body;
//     try {
//         const stored = signupOTPs.get(phone);
//         if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
//             return res.status(400).json({ message: "Invalid or expired OTP" });
//         }
//         // Success
//         res.json({ message: "Verified successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Verification error" });
//     }
// };

// // 3. Phone OTP Login
// exports.adminOTPLogin = async (req, res) => {
//     const { phone, otp } = req.body;
//     try {
//         const admin = await AdminUser.findOne({ 
//             phone, 
//             otp, 
//             otpExpires: { $gt: Date.now() } 
//         });

//         if (!admin) return res.status(400).json({ message: "Invalid or expired OTP" });

//         admin.otp = undefined;
//         admin.otpExpires = undefined;
//         await admin.save();

//         res.json({
//             _id: admin._id,
//             email: admin.email,
//             phone: admin.phone,
//             token: generateToken(admin._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Login error", error: error.message });
//     }
// };

// // 4. Reset Password via OTP
// exports.resetPasswordOTP = async (req, res) => {
//     const { phone, otp, newPassword } = req.body;
//     try {
//         const admin = await AdminUser.findOne({ 
//             phone, 
//             otp, 
//             otpExpires: { $gt: Date.now() } 
//         }).select('+password');

//         if (!admin) return res.status(400).json({ message: "Invalid or expired OTP" });

//         admin.password = newPassword;
//         admin.otp = undefined;
//         admin.otpExpires = undefined;
//         await admin.save();

//         res.json({ message: "Password updated successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Reset error" });
//     }
// };

// // 5. Standard Signup (Final Step)
// exports.adminSignup = async (req, res) => {
//     const { email, password, phone } = req.body;
//     if (!email || !password || !phone) {
//         return res.status(400).json({ message: 'Please fill all fields' });
//     }
//     try {
//         let user = await AdminUser.findOne({ $or: [{ email }, { phone }] });
//         if (user) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         user = await AdminUser.create({ email, password, phone });
//         signupOTPs.delete(phone); // Clear signup memory

//         res.status(201).json({
//             _id: user._id,
//             email: user.email,
//             phone: user.phone,
//             token: generateToken(user._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error during signup', details: error.message });
//     }
// };

// // 6. Standard Email Login
// exports.adminLogin = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await AdminUser.findOne({ email }).select('+password');
//         if (!user || !(await user.matchPassword(password))) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         res.json({
//             _id: user._id,
//             email: user.email,
//             phone: user.phone,
//             token: generateToken(user._id),
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const AdminUser = require('../models/AdminUser');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// Make sure the JSON file path matches where you put the file on your server
const serviceAccount = require('../first-app-9c28c-firebase-adminsdk-fbsvc-389d13f544.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Temporary store for signup OTPs
const signupOTPs = new Map(); 

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error: JWT secret missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to send Firebase Notification
const sendFCMNotification = async (token, otp) => {
    const message = {
        notification: {
            title: 'Your OTP Code',
            body: `Your verification code is: ${otp}`,
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'default',
            },
        },
        token: token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('✅ Firebase notification sent:', response);
        return true;
    } catch (error) {
        console.error('❌ Firebase notification failed:', error);
        return false;
    }
};

// 1. Request OTP (Login, Signup, or Forgot Password)
exports.requestAdminOTP = async (req, res) => {
    // Note: We renamed expoPushToken to fcmToken for clarity
    const { phone, fcmToken, type } = req.body; 
    
    try {
        let adminUser = await AdminUser.findOne({ phone });

        if (type === 'signup') {
            if (adminUser) return res.status(400).json({ message: "Phone number already registered" });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            signupOTPs.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });

            console.log(`\n--- [SIGNUP] OTP for ${phone}: ${otp} ---\n`);

            if (fcmToken) {
                await sendFCMNotification(fcmToken, otp);
            }

            return res.json({ message: "OTP sent (Check your device)" });
        }

        if (!adminUser) {
            return res.status(404).json({ message: "No account found with this phone number" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        adminUser.otp = otp;
        adminUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await adminUser.save();

        console.log(`\n--- [${type.toUpperCase()}] OTP for ${adminUser.email}: ${otp} ---\n`);

        if (fcmToken) {
            await sendFCMNotification(fcmToken, otp);
        }

        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 2. Verify OTP
exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const stored = signupOTPs.get(phone);
        if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        res.json({ message: "Verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Verification error" });
    }
};

// 3. Phone OTP Login
exports.adminOTPLogin = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const adminUser = await AdminUser.findOne({ 
            phone, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!adminUser) return res.status(400).json({ message: "Invalid or expired OTP" });

        adminUser.otp = undefined;
        adminUser.otpExpires = undefined;
        await adminUser.save();

        res.json({
            _id: adminUser._id,
            email: adminUser.email,
            phone: adminUser.phone,
            token: generateToken(adminUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
};

// 4. Reset Password via OTP
exports.resetPasswordOTP = async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    try {
        const adminUser = await AdminUser.findOne({ 
            phone, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        }).select('+password');

        if (!adminUser) return res.status(400).json({ message: "Invalid or expired OTP" });

        adminUser.password = newPassword;
        adminUser.otp = undefined;
        adminUser.otpExpires = undefined;
        await adminUser.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Reset error" });
    }
};

// 5. Standard Signup
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
        signupOTPs.delete(phone); 

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