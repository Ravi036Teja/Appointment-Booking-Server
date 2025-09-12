
// // production issue solution code
// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   date: { type: String, required: true }, // 'YYYY-MM-DD'
//   timeSlot: { type: String, required: true }, // 'HH:mm'
//   amount: { type: Number, required: true },

//   merchantOrderId: {
//     type: String,
//     required: true,
//     unique: true, // Ensures no duplicate order IDs
//   },

//   status: {
//     type: String,
//     enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled"],
//     default: "Pending",
//   },

//   refundStatus: {
//     type: String,
//     enum: ["Not Refunded", "Refund Initiated", "Refunded", "Refund Failed"],
//     default: "Not Refunded",
//   },

//   refundDetails: {
//     merchantRefundId: { type: String },
//     refundTransactionId: { type: String },
//     amount: { type: Number },
//     response: { type: Object }, // Full refund API response (for debugging)
//     createdAt: { type: Date },
//     updatedAt: { type: Date },
//   },

//   paymentDetails: {
//     phonepeTransactionId: { type: String },
//     rawCallback: { type: Object }, // store entire callback response if needed
//   },

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// // Auto-update updatedAt before save
// bookingSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // ✅ Prevent double booking: unique combination of date + timeSlot
// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

// module.exports = mongoose.model("Booking", bookingSchema);

// -----------------------------WORKING CODE-------------------------

// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   date: { type: String, required: true }, // YYYY-MM-DD
//   timeSlot: { type: String, required: true }, // HH:mm
//   amount: { type: Number, required: true },

//   merchantOrderId: { type: String, required: true, unique: true },

//   status: {
//     type: String,
//     enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled"],
//     default: "Pending",
//   },

//   refundStatus: {
//     type: String,
//     enum: ["Not Refunded", "Refund Initiated", "Refunded", "Refund Failed"],
//     default: "Not Refunded",
//   },

//   refundDetails: {
//     merchantRefundId: String,
//     refundTransactionId: String,
//     amount: Number,
//     response: Object,
//     createdAt: Date,
//     updatedAt: Date,
//   },

//   paymentDetails: {
//     phonepeTransactionId: String,
//     rawCallback: Object,
//   },

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// // Auto-update updatedAt
// bookingSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Prevent double booking: unique date + timeSlot
// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

// module.exports = mongoose.model("Booking", bookingSchema);

// -------------------------- the above code works--------------------

// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  timeSlot: { type: String, required: true }, // HH:mm
  amount: { type: Number, required: true },
  
  // New field to prevent race conditions
  isHeld: { type: Boolean, default: false },

  merchantOrderId: { type: String, required: true, unique: true },

  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled"],
    default: "Pending",
  },

  refundStatus: {
    type: String,
    enum: ["Not Refunded", "Refund Initiated", "Refunded", "Refund Failed"],
    default: "Not Refunded",
  },

  refundDetails: {
    merchantRefundId: String,
    refundTransactionId: String,
    amount: Number,
    response: Object,
    createdAt: Date,
    updatedAt: Date,
  },

  paymentDetails: {
    phonepeTransactionId: String,
    rawCallback: Object,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


// Create a unique index for date and timeSlot
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);