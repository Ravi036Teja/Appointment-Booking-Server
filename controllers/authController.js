// const AdminUser = require('../models/AdminUser');
// const OTP = require('../models/OTP');
// const jwt = require('jsonwebtoken');
// const admin = require('firebase-admin');

// // ==================== FIREBASE INITIALIZATION ====================
// // Initialize Firebase Admin SDK from environment variables
// const initializeFirebase = () => {
//     try {
//         if (admin.apps.length > 0) {
//             return; // Already initialized
//         }

//         const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
//         if (!serviceAccountKey) {
//             console.warn('⚠️ WARNING: FIREBASE_SERVICE_ACCOUNT_KEY not set in .env');
//             console.warn('Firebase push notifications will be disabled');
//             return;
//         }

//         const serviceAccount = JSON.parse(serviceAccountKey);

//         admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         });

//         console.log('✅ Firebase Admin SDK initialized successfully');
//     } catch (error) {
//         console.error('❌ Firebase initialization error:', error.message);
//     }
// };

// // Initialize Firebase on startup
// initializeFirebase(); 

// // ==================== UTILITY FUNCTIONS ====================

// // Generate JWT Token
// const generateToken = (id) => {
//     if (!process.env.JWT_SECRET) {
//         throw new Error('Server configuration error: JWT secret missing.');
//     }
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // Validate phone number format (basic validation)
// const validatePhone = (phone) => {
//     const phoneRegex = /^[0-9]{10}$/; // 10-digit phone number
//     return phoneRegex.test(phone.replace(/\D/g, ''));
// };

// // Validate email format
// const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
// };

// // Validate FCM token format
// const validateFCMToken = (token) => {
//     return token && typeof token === 'string' && token.length > 50;
// };

// // Generate random 6-digit OTP
// const generateOTP = () => {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // Send Firebase Cloud Messaging notification
// const sendFCMNotification = async (fcmToken, otp, type = 'signup') => {
//     // Check if Firebase is initialized
//     if (!admin.apps.length) {
//         console.warn('⚠️ Firebase not initialized, skipping push notification');
//         return false;
//     }

//     // Validate FCM token format
//     if (!validateFCMToken(fcmToken)) {
//         console.warn('⚠️ Invalid FCM token format');
//         return false;
//     }

//     const message = {
//         notification: {
//             title: 'Your OTP Code',
//             body: `Your verification code is: ${otp}`,
//         },
//         android: {
//             priority: 'high',
//             notification: {
//                 sound: 'default',
//                 channelId: 'OTP_VERIFICATION',
//             },
//         },
//         apns: {
//             payload: {
//                 aps: {
//                     sound: 'default',
//                     badge: 1,
//                 },
//             },
//         },
//         data: {
//             otp: otp,
//             type: type,
//         },
//         token: fcmToken,
//     };

//     try {
//         const response = await admin.messaging().send(message);
//         console.log('✅ Firebase notification sent:', response);
//         return true;
//     } catch (error) {
//         console.error('❌ Firebase notification error:', error.message);
//         // Log for monitoring but don't fail the OTP request
//         return false;
//     }
// };

// // Check if user is rate limited
// const isRateLimited = async (phone) => {
//     const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    
//     if (!otpRecord) return false;
    
//     // If blocked, check if block period has expired
//     if (otpRecord.isBlocked && otpRecord.blockedUntil) {
//         if (new Date() < otpRecord.blockedUntil) {
//             return true; // Still blocked
//         }
//         // Block period expired, unblock
//         await OTP.updateOne({ _id: otpRecord._id }, { isBlocked: false });
//         return false;
//     }
    
//     return false;
// };

// // Increment OTP attempt counter
// const incrementAttempts = async (phone) => {
//     const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    
//     if (!otpRecord) return;
    
//     const newAttempts = (otpRecord.attempts || 0) + 1;
    
//     if (newAttempts >= 5) {
//         // Block for 15 minutes after 5 failed attempts
//         const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
//         await OTP.updateOne(
//             { _id: otpRecord._id },
//             { 
//                 attempts: newAttempts,
//                 isBlocked: true,
//                 blockedUntil: blockedUntil,
//                 lastAttemptTime: new Date()
//             }
//         );
//     } else {
//         await OTP.updateOne(
//             { _id: otpRecord._id },
//             { 
//                 attempts: newAttempts,
//                 lastAttemptTime: new Date()
//             }
//         );
//     }
// };

// // ==================== EXPORTS ====================

// // 1. Request OTP (Login, Signup, or Forgot Password)
// exports.requestAdminOTP = async (req, res) => {
//     const { phone, fcmToken, type } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!phone || !type) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Phone number and type are required" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         if (!['signup', 'login', 'forgot-password'].includes(type)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid OTP type" 
//             });
//         }

//         // ===== RATE LIMITING CHECK =====
//         if (await isRateLimited(phone)) {
//             return res.status(429).json({ 
//                 success: false,
//                 message: "Too many attempts. Please try again in 15 minutes" 
//             });
//         }

//         // ===== TYPE-SPECIFIC VALIDATION =====
//         let adminUser = await AdminUser.findOne({ phone });

//         if (type === 'signup') {
//             if (adminUser) {
//                 return res.status(400).json({ 
//                     success: false,
//                     message: "Phone number already registered" 
//                 });
//             }
//         } else {
//             if (!adminUser) {
//                 return res.status(404).json({ 
//                     success: false,
//                     message: "No account found with this phone number" 
//                 });
//             }
//         }

//         // ===== GENERATE OTP =====
//         const otp = generateOTP();
//         const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//         // Save OTP to MongoDB
//         await OTP.create({
//             phone,
//             otp,
//             type,
//             expiresAt,
//             attempts: 0,
//             isBlocked: false
//         });

//         console.log(`\n--- [${type.toUpperCase()}] OTP for ${phone}: ${otp} ---\n`);

//         // ===== SEND FCM NOTIFICATION =====
//         if (fcmToken) {
//             await sendFCMNotification(fcmToken, otp, type);
//         } else {
//             console.log('⚠️ No FCM token provided (push notification skipped)');
//         }

//         return res.status(200).json({ 
//             success: true,
//             message: "OTP sent successfully",
//             data: {
//                 phone: phone.slice(-4) // Only return last 4 digits for security
//             }
//         });

//     } catch (error) {
//         console.error('❌ requestAdminOTP error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Failed to send OTP. Please try again later"
//         });
//     }
// };

// // 2. Verify OTP
// exports.verifyOTP = async (req, res) => {
//     const { phone, otp } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!phone || !otp) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Phone and OTP are required" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         // ===== FIND AND VERIFY OTP =====
//         const otpRecord = await OTP.findOne({
//             phone,
//             otp,
//             expiresAt: { $gt: new Date() }, // Not expired
//             isBlocked: false // Not blocked
//         });

//         if (!otpRecord) {
//             // Increment failed attempts
//             await incrementAttempts(phone);

//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid or expired OTP" 
//             });
//         }

//         // ===== MARK OTP AS VERIFIED =====
//         await OTP.updateOne(
//             { _id: otpRecord._id },
//             { 
//                 isVerified: true,
//                 verifiedAt: new Date()
//             }
//         );

//         return res.status(200).json({ 
//             success: true,
//             message: "OTP verified successfully",
//             data: {
//                 phone: phone.slice(-4)
//             }
//         });

//     } catch (error) {
//         console.error('❌ verifyOTP error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Verification failed. Please try again later"
//         });
//     }
// };

// // 3. Phone OTP Login
// exports.adminOTPLogin = async (req, res) => {
//     const { phone, otp } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!phone || !otp) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Phone and OTP are required" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         // ===== VERIFY OTP =====
//         const otpRecord = await OTP.findOne({
//             phone,
//             otp,
//             type: 'login',
//             expiresAt: { $gt: new Date() },
//             isBlocked: false
//         });

//         if (!otpRecord) {
//             await incrementAttempts(phone);
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid or expired OTP" 
//             });
//         }

//         // ===== FIND USER =====
//         const adminUser = await AdminUser.findOne({ phone });

//         if (!adminUser) {
//             return res.status(404).json({ 
//                 success: false,
//                 message: "User account not found" 
//             });
//         }

//         // ===== CLEANUP & LOGIN =====
//         await OTP.deleteOne({ _id: otpRecord._id });

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: {
//                 _id: adminUser._id,
//                 email: adminUser.email,
//                 phone: adminUser.phone,
//                 token: generateToken(adminUser._id),
//             }
//         });

//     } catch (error) {
//         console.error('❌ adminOTPLogin error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Login failed. Please try again later"
//         });
//     }
// };

// // 4. Reset Password via OTP
// exports.resetPasswordOTP = async (req, res) => {
//     const { phone, otp, newPassword } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!phone || !otp || !newPassword) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Phone, OTP, and new password are required" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         if (newPassword.length < 6) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Password must be at least 6 characters" 
//             });
//         }

//         // ===== VERIFY OTP =====
//         const otpRecord = await OTP.findOne({
//             phone,
//             otp,
//             type: 'forgot-password',
//             expiresAt: { $gt: new Date() },
//             isBlocked: false
//         });

//         if (!otpRecord) {
//             await incrementAttempts(phone);
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid or expired OTP" 
//             });
//         }

//         // ===== UPDATE PASSWORD =====
//         const adminUser = await AdminUser.findOne({ phone });

//         if (!adminUser) {
//             return res.status(404).json({ 
//                 success: false,
//                 message: "User not found" 
//             });
//         }

//         adminUser.password = newPassword;
//         await adminUser.save();

//         // ===== CLEANUP =====
//         await OTP.deleteOne({ _id: otpRecord._id });

//         return res.status(200).json({ 
//             success: true,
//             message: "Password reset successfully"
//         });

//     } catch (error) {
//         console.error('❌ resetPasswordOTP error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Password reset failed. Please try again later"
//         });
//     }
// };

// // 5. Standard Signup
// exports.adminSignup = async (req, res) => {
//     const { email, password, phone } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!email || !password || !phone) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Email, password, and phone are required" 
//             });
//         }

//         if (!validateEmail(email)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid email format" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         if (password.length < 6) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Password must be at least 6 characters" 
//             });
//         }

//         // ===== CHECK EXISTING USER =====
//         let existingUser = await AdminUser.findOne({ 
//             $or: [{ email: email.toLowerCase() }, { phone }] 
//         });

//         if (existingUser) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "User already exists with this email or phone" 
//             });
//         }

//         // ===== CREATE NEW USER =====
//         const newUser = await AdminUser.create({
//             email: email.toLowerCase(),
//             password,
//             phone
//         });

//         // ===== CLEANUP OTP =====
//         await OTP.deleteMany({ phone, type: 'signup' });

//         return res.status(201).json({
//             success: true,
//             message: "Signup successful",
//             data: {
//                 _id: newUser._id,
//                 email: newUser.email,
//                 phone: newUser.phone,
//                 token: generateToken(newUser._id),
//             }
//         });

//     } catch (error) {
//         console.error('❌ adminSignup error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Signup failed. Please try again later"
//         });
//     }
// };

// // 6. Standard Email Login
// exports.adminLogin = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!email || !password) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Email and password are required" 
//             });
//         }

//         if (!validateEmail(email)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid email format" 
//             });
//         }

//         // ===== FIND USER & VERIFY PASSWORD =====
//         const adminUser = await AdminUser.findOne({ 
//             email: email.toLowerCase() 
//         }).select('+password');

//         if (!adminUser || !(await adminUser.matchPassword(password))) {
//             return res.status(401).json({ 
//                 success: false,
//                 message: "Invalid email or password" 
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: {
//                 _id: adminUser._id,
//                 email: adminUser.email,
//                 phone: adminUser.phone,
//                 token: generateToken(adminUser._id),
//             }
//         });

//     } catch (error) {
//         console.error('❌ adminLogin error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Login failed. Please try again later"
//         });
//     }
// };


const AdminUser = require('../models/AdminUser');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// ==================== FIREBASE INITIALIZATION ====================
// Initialize Firebase Admin SDK from environment variables
const initializeFirebase = () => {
    try {
        if (admin.apps.length > 0) {
            return; // Already initialized
        }

        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            console.warn('⚠️ WARNING: FIREBASE_SERVICE_ACCOUNT_KEY not set in .env');
            console.warn('Firebase push notifications will be disabled');
            return;
        }

        const serviceAccount = JSON.parse(serviceAccountKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
    }
};

// Initialize Firebase on startup
initializeFirebase(); 

// ==================== UTILITY FUNCTIONS ====================

// Generate JWT Token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('Server configuration error: JWT secret missing.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ✅ FIX 1: IMPROVED PHONE VALIDATION - Supports international formats
const validatePhone = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Accept 10 digits (local) or 11-12 digits (with country code)
    // Examples: 9876543210, +919876543210, 0919876543210
    return /^[0-9]{10}$|^[0-9]{11,12}$/.test(digits);
};

// Validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate FCM token format
const validateFCMToken = (token) => {
    return token && typeof token === 'string' && token.length > 50;
};

// Generate random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ FIX 7: PASSWORD VALIDATION - Improved security requirements
const validatePassword = (password) => {
    // At least 6 chars (for backward compatibility)
    // You can enhance this later with: 
    // At least 8 chars, 1 uppercase, 1 number
    // const strongRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    return password && password.length >= 6;
};

// Send Firebase Cloud Messaging notification
const sendFCMNotification = async (fcmToken, otp, type = 'signup') => {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
        console.warn('⚠️ Firebase not initialized, skipping push notification');
        return false;
    }

    // Validate FCM token format
    if (!validateFCMToken(fcmToken)) {
        console.warn('⚠️ Invalid FCM token format:', fcmToken.substring(0, 20) + '...');
        return false;
    }

    const message = {
        notification: {
            title: '🔐 Your Verification Code',
            body: `Your OTP is: ${otp} (Valid for 10 minutes)`,
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'OTP_VERIFICATION',
                color: '#B91C1C', // Your brand color
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                },
            },
        },
        data: {
            otp: otp,
            type: type,
        },
        token: fcmToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('✅ Firebase notification sent successfully:', response);
        return true;
    } catch (error) {
        console.error('❌ Firebase notification error:', error.message);
        // Log for monitoring but don't fail the OTP request
        return false;
    }
};

// Check if user is rate limited
const isRateLimited = async (phone) => {
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    
    if (!otpRecord) return false;
    
    // If blocked, check if block period has expired
    if (otpRecord.isBlocked && otpRecord.blockedUntil) {
        if (new Date() < otpRecord.blockedUntil) {
            return true; // Still blocked
        }
        // Block period expired, unblock
        await OTP.updateOne({ _id: otpRecord._id }, { isBlocked: false });
        return false;
    }
    
    return false;
};

// Increment OTP attempt counter
const incrementAttempts = async (phone) => {
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    
    if (!otpRecord) return;
    
    const newAttempts = (otpRecord.attempts || 0) + 1;
    
    if (newAttempts >= 5) {
        // Block for 15 minutes after 5 failed attempts
        const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await OTP.updateOne(
            { _id: otpRecord._id },
            { 
                attempts: newAttempts,
                isBlocked: true,
                blockedUntil: blockedUntil,
                lastAttemptTime: new Date()
            }
        );
        console.log(`⚠️ User rate limited - phone: ${phone}, blocked until: ${blockedUntil}`);
    } else {
        await OTP.updateOne(
            { _id: otpRecord._id },
            { 
                attempts: newAttempts,
                lastAttemptTime: new Date()
            }
        );
    }
};

// ==================== EXPORTS ====================

// 1. Request OTP (Login, Signup, or Forgot Password)
// exports.requestAdminOTP = async (req, res) => {
//     const { phone, fcmToken, type } = req.body;

//     try {
//         // ===== INPUT VALIDATION =====
//         if (!phone || !type) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Phone number and type are required" 
//             });
//         }

//         if (!validatePhone(phone)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid phone number format" 
//             });
//         }

//         if (!['signup', 'login', 'forgot-password'].includes(type)) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: "Invalid OTP type" 
//             });
//         }

//         // ===== RATE LIMITING CHECK =====
//         if (await isRateLimited(phone)) {
//             return res.status(429).json({ 
//                 success: false,
//                 message: "Too many attempts. Please try again in 15 minutes" 
//             });
//         }

//         // ===== TYPE-SPECIFIC VALIDATION =====
//         let adminUser = await AdminUser.findOne({ phone });

//         if (type === 'signup') {
//             if (adminUser) {
//                 return res.status(400).json({ 
//                     success: false,
//                     message: "Phone number already registered" 
//                 });
//             }
//         } else {
//             if (!adminUser) {
//                 return res.status(404).json({ 
//                     success: false,
//                     message: "No account found with this phone number" 
//                 });
//             }
//         }

//         // ===== GENERATE OTP =====
//         const otp = generateOTP();
//         const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//         // ✅ FIX 2: DELETE OLD OTPs BEFORE CREATING NEW ONE
//         await OTP.deleteMany({ phone, type, isVerified: false });

//         // Save OTP to MongoDB
//         await OTP.create({
//             phone,
//             otp,
//             type,
//             expiresAt,
//             attempts: 0,
//             isBlocked: false,
//             isVerified: false // Start as unverified
//         });

//         console.log(`\n--- [${type.toUpperCase()}] OTP for ${phone}: ${otp} ---\n`);

//         // ===== SEND FCM NOTIFICATION =====
//         if (fcmToken) {
//             // ✅ FIX 3: VALIDATE FCM TOKEN FORMAT BEFORE SENDING
//             if (validateFCMToken(fcmToken)) {
//                 await sendFCMNotification(fcmToken, otp, type);
//             } else {
//                 console.warn('⚠️ Invalid FCM token format provided - notification skipped');
//             }
//         } else {
//             console.log('⚠️ No FCM token provided (Expo Go mode - push notification skipped)');
//         }

//         return res.status(200).json({ 
//             success: true,
//             message: "OTP sent successfully",
//             data: {
//                 phone: phone.slice(-4) // Only return last 4 digits for security
//             }
//         });

//     } catch (error) {
//         console.error('❌ requestAdminOTP error:', error);
//         return res.status(500).json({ 
//             success: false,
//             message: "Failed to send OTP. Please try again later"
//         });
//     }
// };

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

// 2. Verify OTP
exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        // ===== INPUT VALIDATION =====
        if (!phone || !otp) {
            return res.status(400).json({ 
                success: false,
                message: "Phone and OTP are required" 
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid phone number format" 
            });
        }

        // ===== FIND AND VERIFY OTP =====
        // ✅ FIX 4: CHECK isVerified FLAG TO PREVENT double verification
        const otpRecord = await OTP.findOne({
            phone,
            otp,
            expiresAt: { $gt: new Date() }, // Not expired
            isBlocked: false, // Not blocked
            isVerified: false // Not already verified
        });

        if (!otpRecord) {
            // Increment failed attempts
            await incrementAttempts(phone);

            return res.status(400).json({ 
                success: false,
                message: "Invalid, expired, or already verified OTP" 
            });
        }

        // ===== MARK OTP AS VERIFIED =====
        await OTP.updateOne(
            { _id: otpRecord._id },
            { 
                isVerified: true,
                verifiedAt: new Date()
            }
        );

        console.log(`✅ OTP verified for phone: ${phone}`);

        return res.status(200).json({ 
            success: true,
            message: "OTP verified successfully",
            data: {
                phone: phone.slice(-4)
            }
        });

    } catch (error) {
        console.error('❌ verifyOTP error:', error);
        return res.status(500).json({ 
            success: false,
            message: "Verification failed. Please try again later"
        });
    }
};

// 3. Phone OTP Login
exports.adminOTPLogin = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        // ===== INPUT VALIDATION =====
        if (!phone || !otp) {
            return res.status(400).json({ 
                success: false,
                message: "Phone and OTP are required" 
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid phone number format" 
            });
        }

        // ===== VERIFY OTP =====
        const otpRecord = await OTP.findOne({
            phone,
            otp,
            type: 'login',
            expiresAt: { $gt: new Date() },
            isBlocked: false,
            isVerified: true // Should be verified before login
        });

        if (!otpRecord) {
            await incrementAttempts(phone);
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired OTP" 
            });
        }

        // ===== FIND USER =====
        const adminUser = await AdminUser.findOne({ phone });

        if (!adminUser) {
            return res.status(404).json({ 
                success: false,
                message: "User account not found" 
            });
        }

        // ===== CLEANUP & LOGIN =====
        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: adminUser._id,
                email: adminUser.email,
                phone: adminUser.phone,
                token: generateToken(adminUser._id),
            }
        });

    } catch (error) {
        console.error('❌ adminOTPLogin error:', error);
        return res.status(500).json({ 
            success: false,
            message: "Login failed. Please try again later"
        });
    }
};

// 4. Reset Password via OTP
exports.resetPasswordOTP = async (req, res) => {
    const { phone, otp, newPassword } = req.body;

    try {
        // ===== INPUT VALIDATION =====
        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: "Phone, OTP, and new password are required" 
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid phone number format" 
            });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                success: false,
                message: "Password must be at least 6 characters" 
            });
        }

        // ===== VERIFY OTP =====
        const otpRecord = await OTP.findOne({
            phone,
            otp,
            type: 'forgot-password',
            expiresAt: { $gt: new Date() },
            isBlocked: false,
            isVerified: true // Should be verified before password reset
        });

        if (!otpRecord) {
            await incrementAttempts(phone);
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired OTP" 
            });
        }

        // ===== UPDATE PASSWORD =====
        const adminUser = await AdminUser.findOne({ phone });

        if (!adminUser) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        adminUser.password = newPassword;
        await adminUser.save(); // Password is hashed by pre-save hook

        // ===== CLEANUP =====
        await OTP.deleteOne({ _id: otpRecord._id });

        console.log(`✅ Password reset successful for phone: ${phone}`);

        return res.status(200).json({ 
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error('❌ resetPasswordOTP error:', error);
        return res.status(500).json({ 
            success: false,
            message: "Password reset failed. Please try again later"
        });
    }
};

// 5. Standard Signup
exports.adminSignup = async (req, res) => {
    const { email, password, phone } = req.body;

    try {
        // ===== INPUT VALIDATION =====
        if (!email || !password || !phone) {
            return res.status(400).json({ 
                success: false,
                message: "Email, password, and phone are required" 
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format" 
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid phone number format" 
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false,
                message: "Password must be at least 6 characters" 
            });
        }

        // ===== CHECK EXISTING USER =====
        let existingUser = await AdminUser.findOne({ 
            $or: [{ email: email.toLowerCase() }, { phone }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: "User already exists with this email or phone" 
            });
        }

        // ===== CREATE NEW USER =====
        const newUser = await AdminUser.create({
            email: email.toLowerCase(),
            password,
            phone
        });

        // ===== CLEANUP OTP =====
        await OTP.deleteMany({ phone, type: 'signup' });

        console.log(`✅ Admin signup successful - Email: ${newUser.email}, Phone: ${newUser.phone}`);

        return res.status(201).json({
            success: true,
            message: "Signup successful",
            data: {
                _id: newUser._id,
                email: newUser.email,
                phone: newUser.phone,
                token: generateToken(newUser._id),
            }
        });

    } catch (error) {
        console.error('❌ adminSignup error:', error);
        return res.status(500).json({ 
            success: false,
            message: "Signup failed. Please try again later"
        });
    }
};

// 6. Standard Email Login
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // ===== INPUT VALIDATION =====
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email and password are required" 
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format" 
            });
        }

        // ===== FIND USER & VERIFY PASSWORD =====
        const adminUser = await AdminUser.findOne({ 
            email: email.toLowerCase() 
        }).select('+password');

        if (!adminUser || !(await adminUser.matchPassword(password))) {
            console.warn(`⚠️ Failed login attempt for email: ${email}`);
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        console.log(`✅ Admin login successful - Email: ${email}`);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: adminUser._id,
                email: adminUser.email,
                phone: adminUser.phone,
                token: generateToken(adminUser._id),
            }
        });

    } catch (error) {
        console.error('❌ adminLogin error:', error);
        return res.status(500).json({ 
            success: false,
            message: "Login failed. Please try again later"
        });
    }
};
