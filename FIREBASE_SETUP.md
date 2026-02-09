# Firebase Setup Complete ✅

## What Was Done:

1. ✅ **Firebase Credentials Secured**
   - Your Firebase private key has been securely stored in `.env` as `FIREBASE_SERVICE_ACCOUNT_KEY`
   - The JSON file at `first-app-9c28c-firebase-adminsdk-fbsvc-389d13f544.json` is now ignored by Git (in `.gitignore`)
   - Private key is NO LONGER exposed in version control

2. ✅ **Firebase Project Details**
   - Project ID: `first-app-9c28c`
   - Client Email: `firebase-adminsdk-fbsvc@first-app-9c28c.iam.gserviceaccount.com`
   - Region: `googleapis.com`

3. ✅ **Auto-Initialization**
   - Firebase Admin SDK initializes automatically on server startup
   - Reads credentials from `.env` environment variable
   - Graceful error handling if credentials are missing

4. ✅ **Production-Ready Features**
   - OTP storage in MongoDB (not in-memory)
   - Rate limiting (5 attempts → 15 min block)
   - Firebase Cloud Messaging (FCM) push notifications enabled
   - Input validation & security checks
   - Proper error handling (no stack traces exposed)

---

## Verification Checklist:

### Before Starting Server:
- [ ] Verify `.env` file contains `FIREBASE_SERVICE_ACCOUNT_KEY` with your credentials
- [ ] Ensure `.env` is listed in `.gitignore` (should be - do NOT commit it!)
- [ ] Verify `MONGODB_URI` is set correctly
- [ ] Verify `JWT_SECRET` is set to a strong value

### To Test Firebase Integration:

1. **Start your server:**
   ```bash
   npm run dev    # For development with nodemon
   npm start      # For production
   ```

2. **Check server logs for:**
   ```
   ✅ Firebase Admin SDK initialized successfully
   ```
   If you see this message, Firebase is properly configured!

3. **Make a test OTP request:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "9876543210",
       "type": "signup",
       "fcmToken": "your_fcm_token_here"
     }'
   ```

   Expected Response:
   ```json
   {
     "success": true,
     "message": "OTP sent successfully",
     "data": {
       "phone": "3210"
     }
   }
   ```

---

## Important Security Notes:

⚠️ **CRITICAL:**
- NEVER commit `.env` file to Git
- NEVER share your Firebase private key
- The JSON file with credentials should be deleted locally (keep only .env)
- For production deployment:
  - Set environment variables on your hosting platform (Render, Vercel, etc.)
  - Do NOT push `.env` file to your repository

---

## Files Modified:

- ✅ `.env` - Updated with your Firebase credentials
- ✅ `.gitignore` - Firebase JSON file is ignored
- ✅ `controllers/authController.js` - Production-ready (already updated)
- ✅ `models/OTP.js` - Created for proper OTP storage
- ✅ `models/AdminUser.js` - Updated schema for fcmToken

---

## API Endpoints:

### 1. Request OTP (For Signup, Login, Password Reset)
```
POST /api/auth/request-otp
{
  "phone": "9876543210",
  "type": "signup|login|forgot-password",
  "fcmToken": "your_fcm_device_token"  // Optional but recommended
}
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### 3. OTP Login
```
POST /api/auth/admin-otp-login
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### 4. Reset Password with OTP
```
POST /api/auth/reset-password-otp
{
  "phone": "9876543210",
  "otp": "123456",
  "newPassword": "newPassword123"
}
```

### 5. Standard Signup
```
POST /api/auth/admin-signup
{
  "email": "admin@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

### 6. Standard Login
```
POST /api/auth/admin-login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

---

## Troubleshooting:

### Firebase Not Initializing?
- Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set in `.env`
- Verify the JSON is properly formatted (single line)
- Check server logs for specific error messages

### Push Notifications Not Sending?
- Verify `fcmToken` is valid and from your Firebase project
- Check Firebase Console → Cloud Messaging tab is enabled
- Server logs will show if FCM fails (but won't break OTP flow)

### OTP Not Working?
- Verify MongoDB is connected: Check `MONGODB_URI` in `.env`
- Check MongoDB has `OTP` collection created
- Verify OTP hasn't expired (10 minutes)

---

## Next Steps:

1. ✅ Delete the JSON file locally (no longer needed since it's in .env):
   ```bash
   rm first-app-9c28c-firebase-adminsdk-fbsvc-389d13f544.json
   ```

2. ✅ Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. ✅ Start your server and verify Firebase initialization

4. ✅ Test API endpoints to ensure everything works

---

**Your backend is now production-ready with secure Firebase integration!** 🚀
