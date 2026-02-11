
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const adminUserSchema = new mongoose.Schema({
//     email: { 
//         type: String, 
//         required: true, 
//         unique: true,
//         lowercase: true,
//         trim: true 
//     },
//     password: { 
//         type: String, 
//         required: true, 
//         select: false 
//     },
//     phone: { 
//         type: String, 
//         unique: true, 
//         sparse: true,
//         trim: true 
//     },
//     // ✅ OPTIONAL: Store FCM token for future push notifications
//     // Useful for sending notifications for booking confirmations, updates, etc.
//     fcmToken: { 
//         type: String,
//         trim: true
//     },
//     // Metadata
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     lastLogin: {
//         type: Date
//     }
// }, { timestamps: true });

// // Hash password before saving
// adminUserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) {
//         return next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });

// // Method to compare password for login
// adminUserSchema.methods.matchPassword = async function(enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// // Instance method to log last login
// adminUserSchema.methods.recordLogin = async function() {
//     this.lastLogin = new Date();
//     await this.save();
// };

// module.exports = mongoose.model('AdminUser', adminUserSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true, 
        select: false 
    },
    phone: { 
        type: String, 
        unique: true, 
        sparse: true,
        trim: true 
    },
    fcmToken: { 
        type: String,
        trim: true
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, { timestamps: true });

adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminUserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);