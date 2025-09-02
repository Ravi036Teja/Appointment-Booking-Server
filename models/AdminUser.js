// // backend/models/AdminUser.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const adminUserSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     trim: true,
//     lowercase: true,
//     match: [/.+@.+\..+/, 'Please enter a valid email address']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters long'],
//     select: false // <--- ADDED: Do not return password by default when querying users
//   },
//   // You might want to add a 'role' field later if you have different admin levels
//   // role: {
//   //   type: String,
//   //   enum: ['admin', 'superadmin', 'editor'],
//   //   default: 'admin'
//   // },
//   // createdAt: { // This is redundant if timestamps: true is used
//   //   type: Date,
//   //   default: Date.now
//   // }
// }, {
//   timestamps: true // <--- ADDED: Mongoose will automatically manage createdAt and updatedAt fields
// });

// // Hash password before saving
// adminUserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Method to compare password
// adminUserSchema.methods.matchPassword = async function(enteredPassword) {
//   // 'this.password' here will be the hashed password IF it was explicitly selected in the query
//   // or if 'select: false' was not set on the schema.
//   // With `select: false` now added, the controller MUST use `.select('+password')`.
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('AdminUser', adminUserSchema);

// backend/models/AdminUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    // New fields for invitation logic
    invitationToken: String,
    invitationExpires: Date,
}, {
    timestamps: true
});

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