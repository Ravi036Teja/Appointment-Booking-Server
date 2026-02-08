
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const adminUserSchema = new mongoose.Schema({
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         trim: true,
//         lowercase: true,
//         match: [/.+@.+\..+/, 'Please enter a valid email address']
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         minlength: [6, 'Password must be at least 6 characters long'],
//         select: false
//     },
//     // New fields for invitation logic
//     invitationToken: String,
//     invitationExpires: Date,
// }, {
//     timestamps: true
// });

// adminUserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) {
//         return next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });

// adminUserSchema.methods.matchPassword = async function(enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('AdminUser', adminUserSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    // --- NEW FIELDS ---
    phone: { type: String, unique: true, sparse: true }, // Sparse allows nulls for those using only email
    otp: { type: String },
    otpExpires: { type: Date },
    expoPushToken: { type: String }, // Store this to know where to send the OTP
}, { timestamps: true });

 adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminUserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
