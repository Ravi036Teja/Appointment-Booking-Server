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

module.exports = mongoose.model('OTP', otpSchema);
