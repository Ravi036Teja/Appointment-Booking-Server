// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   date: { type: String, required: true },  // Format: YYYY-MM-DD
//   timeSlot: { type: String, required: true }, // Format: HH:mm
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
// });


// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true }); // Prevent duplicate bookings


// module.exports = mongoose.model("Booking", bookingSchema);

// backend/models/Booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, "Date is required"],
    trim: true
  },
  timeSlot: {
    type: String, // Format: HH:mm
    required: [true, "Time slot is required"],
    trim: true
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    match: [/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"] // Allows spaces for full names
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^\d{10,}$/, "Please enter a valid 10-digit WhatsApp number"], // Basic 10+ digits, adjust regex for specific country codes if needed
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate bookings for the same date and timeSlot
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
// after phonepe geteway

// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   date: { type: String, required: true }, // Format: YYYY-MM-DD
//   timeSlot: { type: String, required: true }, // Format: HH:mm
//   email: { type: String, required: true },
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   // Add payment-related fields (optional, but good for tracking)
//   paymentStatus: {
//     type: String,
//     enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
//     default: "PENDING",
//   },
//   phonePeTransactionId: { type: String, unique: true, sparse: true }, // Store PhonePe's transaction ID
//   merchantTransactionId: { type: String, unique: true, required: true }, // Your unique ID for this transaction
// });

// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true }); // Prevent duplicate bookings

// module.exports = mongoose.model("Booking", bookingSchema);