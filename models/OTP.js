// const mongoose = require('mongoose');

// const otpSchema = new mongoose.Schema({
//     phone: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     otp: {
//         type: String,
//         required: true
//     },
//     type: {
//         type: String,
//         enum: ['signup', 'login', 'forgot-password'],
//         default: 'signup'
//     },
//     expiresAt: {
//         type: Date,
//         required: true,
//         index: { expires: 0 } // TTL index - auto-delete expired documents
//     },
//     attempts: {
//         type: Number,
//         default: 0,
//         max: 5 // Max 5 attempts before blocking
//     },
//     lastAttemptTime: {
//         type: Date
//     },
//     isBlocked: {
//         type: Boolean,
//         default: false
//     },
//     blockedUntil: {
//         type: Date
//     }
// }, { timestamps: true });

// // TTL index to auto-delete documents after expiration
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// module.exports = mongoose.model('OTP', otpSchema);



const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['signup', 'login', 'forgot-password'],
        default: 'signup'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto-delete expired documents
    },
    // ✅ NEW: Track verification state
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    // Existing fields for rate limiting
    attempts: {
        type: Number,
        default: 0,
        max: 5 // Max 5 attempts before blocking
    },
    lastAttemptTime: {
        type: Date
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedUntil: {
        type: Date
    }
}, { timestamps: true });

// TTL index to auto-delete documents after expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
otpSchema.index({ phone: 1, type: 1 });
otpSchema.index({ phone: 1, isVerified: 1 });

module.exports = mongoose.model('OTP', otpSchema);
