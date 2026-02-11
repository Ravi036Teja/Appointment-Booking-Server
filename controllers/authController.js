// const AdminUser = require('../models/AdminUser');
// const OTP = require('../models/OTP');
// const jwt = require('jsonwebtoken');
// const admin = require('firebase-admin');
// // const serviceAccount = require('../first-app-9c28c-firebase-adminsdk-fbsvc-4682e84a43.json');

// const initializeFirebase = () => {
//     try {
//         // Prevent multiple initializations
//         if (admin.apps.length > 0) return;

//         const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

//         if (!rawServiceAccount) {
//             console.error('❌ CRITICAL: FIREBASE_SERVICE_ACCOUNT env variable is missing!');
//             return;
//         }

//         // 1. Parse string to Object
//         let serviceAccount = typeof rawServiceAccount === 'string' 
//             ? JSON.parse(rawServiceAccount) 
//             : rawServiceAccount;

//         // 2. Fix the private_key newline issue (common in Vercel/Render)
//         if (serviceAccount.private_key) {
//             serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
//         }

//         // 3. Initialize
//         admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         });

//         console.log('✅ Firebase Admin SDK initialized for project:', serviceAccount.project_id);
//     } catch (error) {
//         console.error('❌ Firebase initialization failed:', error.message);
//     }
// };

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

// // Generic Send OTP function (Wrapper)
// const sendOTP = async (phone, otp, fcmToken = null) => {
//     let sentViaPush = false;

//     // 1. Try sending via Push Notification if token exists
//     if (fcmToken) {
//         sentViaPush = await sendFCMNotification(fcmToken, otp);
//     }

//     // 2. If Push failed or no token, fallback to SMS (Optional: Integrate Twilio/Msg91 here)
//     if (!sentViaPush) {
//         console.log(`📡 Sending SMS to ${phone}: Your code is ${otp}`);
//         // Example: await smsProvider.send(phone, `Your code is ${otp}`);
//         // return true; 
//     }

//     return sentViaPush;
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

// console.log(`\n--- [${type.toUpperCase()}] OTP for ${phone}: ${otp} ---\n`);

// // ===== SEND OTP VIA WRAPPER =====
// // This handles FCM and provides a fallback console log for SMS
// const delivered = await sendOTP(phone, otp, fcmToken);

// if (!delivered) {
//     console.warn('⚠️ OTP delivery failed or no FCM token provided. Check server logs.');
// }

// // Final response to the client
// return res.status(200).json({ 
//     success: true,
//     message: "OTP sent successfully",
//     data: {
//         phone: phone.slice(-4) 
//     }
// });
        

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
const fs = require('fs');

// ==================== FIREBASE INITIALIZATION ====================
const initializeFirebase = () => {
    try {
        // Prevent multiple initializations
        if (admin.apps.length > 0) return true;

        let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        let accountConfig;

        if (!serviceAccount) {
            console.error('❌ CRITICAL: FIREBASE_SERVICE_ACCOUNT env variable is missing!');
            return false;
        }

        // 1. Try to handle if it's a File Path (Render "Secret File" or local file)
        if (typeof serviceAccount === 'string' && (serviceAccount.startsWith('/') || serviceAccount.startsWith('./') || serviceAccount.startsWith('\\'))) {
            if (fs.existsSync(serviceAccount)) {
                try {
                    const fileContent = fs.readFileSync(serviceAccount, 'utf8');
                    accountConfig = JSON.parse(fileContent);
                    console.log('✅ Loaded Firebase config from file:', serviceAccount);
                } catch (err) {
                    console.error('❌ Failed to read/parse Firebase config file:', err.message);
                }
            } else {
                 console.warn(`⚠️ Path provided in env but file not found: ${serviceAccount}. Trying to parse as JSON string...`);
            }
        }

        // 2. If not a file (or file failed), try to parse as JSON string
        if (!accountConfig) {
            try {
                if (typeof serviceAccount === 'string') {
                    // Cleanup: remove incorrect wrapping quotes users sometimes add in .env
                    serviceAccount = serviceAccount.trim();
                    if ((serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) || 
                        (serviceAccount.startsWith('"') && serviceAccount.endsWith('"'))) {
                        serviceAccount = serviceAccount.slice(1, -1);
                    }
                    accountConfig = JSON.parse(serviceAccount);
                } else {
                    accountConfig = serviceAccount; // It's already an object
                }
            } catch (error) {
                console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
                // Log first 20 chars to debug what was received (safe)
                console.log('Debug - Raw value start:', String(process.env.FIREBASE_SERVICE_ACCOUNT).substring(0, 20));
                return false;
            }
        }

        // 3. Fix Private Key Newlines (Critical for Vercel/Render)
        if (accountConfig && accountConfig.private_key) {
            accountConfig.private_key = accountConfig.private_key.replace(/\\n/g, '\n');
        } else {
            console.error('❌ CRITICAL: Invalid Service Account - missing private_key!');
            return false;
        }

        // 4. Initialize
        admin.initializeApp({
            credential: admin.credential.cert(accountConfig)
        });

        console.log('✅ Firebase Admin SDK initialized for project:', accountConfig.project_id);
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization crashed:', error.message);
        return false;
    }
};

// Attempt initialization on startup
initializeFirebase();

// ==================== UTILITY FUNCTIONS ====================

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod', { expiresIn: '30d' });
};

const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Send Firebase Cloud Messaging notification
const sendFCMNotification = async (fcmToken, otp, type = 'signup') => {
    // 1. Lazy Initialization: Try to init again if it failed on startup
    if (admin.apps.length === 0) {
        console.warn('⚠️ Firebase not ready, attempting to re-initialize...');
        const success = initializeFirebase();
        if (!success) {
            console.error('❌ Skipping Push Notification: Firebase could not be initialized.');
            return false;
        }
    }

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 10) {
        console.warn('⚠️ Invalid FCM token provided, skipping push.');
        return false;
    }

    const message = {
        notification: {
            title: 'Your OTP Code',
            body: `Your verification code is: ${otp}`,
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'OTP_VERIFICATION',
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
        await admin.messaging().send(message);
        console.log('✅ Firebase notification sent successfully to:', fcmToken.slice(-10));
        return true;
    } catch (error) {
        console.error('❌ Firebase notification sending error:', error.message);
        return false;
    }
};

const isRateLimited = async (phone) => {
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpRecord) return false;
    
    if (otpRecord.isBlocked && otpRecord.blockedUntil) {
        if (new Date() < otpRecord.blockedUntil) {
            return true; 
        }
        await OTP.updateOne({ _id: otpRecord._id }, { isBlocked: false });
        return false;
    }
    return false;
};

// ==================== EXPORTS ====================

exports.requestAdminOTP = async (req, res) => {
    const { phone, fcmToken, type } = req.body;

    try {
        if (!phone || !type) return res.status(400).json({ success: false, message: "Phone number and type are required" });
        if (!validatePhone(phone)) return res.status(400).json({ success: false, message: "Invalid phone number format" });

        if (await isRateLimited(phone)) {
            return res.status(429).json({ success: false, message: "Too many attempts. Please try again in 15 minutes" });
        }

        let adminUser = await AdminUser.findOne({ phone });

        if (type === 'signup' && adminUser) {
            return res.status(400).json({ success: false, message: "Phone number already registered" });
        } 
        if ((type === 'login' || type === 'forgot-password') && !adminUser) {
            return res.status(404).json({ success: false, message: "No account found with this phone number" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP
        await OTP.create({
            phone,
            otp,
            type,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 0
        });

        console.log(`\n--- [${type.toUpperCase()}] OTP for ${phone}: ${otp} ---\n`);

        // Send Notification
        let delivered = false;
        if (fcmToken) {
            delivered = await sendFCMNotification(fcmToken, otp, type);
        } else {
            console.log('⚠️ No FCM token provided');
        }

        return res.status(200).json({ 
            success: true,
            message: "OTP sent successfully",
            data: { phone: phone.slice(-4), deliveryStatus: delivered ? 'sent' : 'logged' }
        });

    } catch (error) {
        console.error('❌ requestAdminOTP error:', error);
        return res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });

        const otpRecord = await OTP.findOne({
            phone,
            otp,
            expiresAt: { $gt: new Date() },
            isBlocked: false
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        await OTP.updateOne({ _id: otpRecord._id }, { isVerified: true, verifiedAt: new Date() });

        return res.status(200).json({ success: true, message: "OTP verified", data: { phone: phone.slice(-4) } });
    } catch (error) {
        console.error('❌ verifyOTP error:', error);
        return res.status(500).json({ success: false, message: "Verification failed" });
    }
};

exports.adminOTPLogin = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        const otpRecord = await OTP.findOne({
            phone,
            otp,
            type: 'login',
            expiresAt: { $gt: new Date() },
            isBlocked: false
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const adminUser = await AdminUser.findOne({ phone });
        if (!adminUser) return res.status(404).json({ success: false, message: "User not found" });

        // Update FCM Token on login if provided in request (Optional but good practice)
        if (req.body.fcmToken) {
            adminUser.fcmToken = req.body.fcmToken;
            await adminUser.save();
        }

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
        return res.status(500).json({ success: false, message: "Login failed" });
    }
};

exports.adminSignup = async (req, res) => {
    const { email, password, phone } = req.body;
    try {
        if (!email || !password || !phone) return res.status(400).json({ success: false, message: "All fields required" });

        const existingUser = await AdminUser.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

        const newUser = await AdminUser.create({ email, password, phone });
        
        await OTP.deleteMany({ phone, type: 'signup' });

        return res.status(201).json({
            success: true,
            message: "Signup successful",
            data: {
                _id: newUser._id,
                email: newUser.email,
                token: generateToken(newUser._id),
            }
        });
    } catch (error) {
        console.error('❌ adminSignup error:', error);
        return res.status(500).json({ success: false, message: "Signup failed" });
    }
};

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

        const adminUser = await AdminUser.findOne({ email }).select('+password');
        if (!adminUser || !(await adminUser.matchPassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: adminUser._id,
                email: adminUser.email,
                token: generateToken(adminUser._id),
            }
        });
    } catch (error) {
        console.error('❌ adminLogin error:', error);
        return res.status(500).json({ success: false, message: "Login failed" });
    }
};

exports.resetPasswordOTP = async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    try {
        if (!phone || !otp || !newPassword) return res.status(400).json({ success: false, message: "Missing fields" });

        const otpRecord = await OTP.findOne({ phone, otp, type: 'forgot-password', expiresAt: { $gt: new Date() } });
        if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid OTP" });

        const adminUser = await AdminUser.findOne({ phone });
        if (!adminUser) return res.status(404).json({ success: false, message: "User not found" });

        adminUser.password = newPassword;
        await adminUser.save();
        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error('❌ resetPasswordOTP error:', error);
        return res.status(500).json({ success: false, message: "Reset failed" });
    }
};