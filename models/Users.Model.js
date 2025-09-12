// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },
//   phone: { type: String, required: true, unique: true },
//   password: {
//     type: String,
//     required: true,
//   },
//   // We can store a reference to their bookings here for a quick lookup.
//   bookings: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Booking',
//     },
//   ],
// }, {
//   timestamps: true,
// });

// // Hash the plain text password before saving
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// // Method to compare passwords
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// module.exports = User;

// models/Users.Model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: true,
  },
  // ✅ UNCOMMENT THIS: Reference to their bookings
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
  ],
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;