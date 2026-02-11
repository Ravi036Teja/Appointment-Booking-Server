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
        index: { expires: 0 } // TTL index - MongoDB automatically deletes when this time is reached
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    attempts: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedUntil: {
        type: Date
    }
}, { timestamps: true });

// Ensure indexes are created
otpSchema.index({ phone: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);