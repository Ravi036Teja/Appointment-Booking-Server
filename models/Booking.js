const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
  },
  timeSlot: {
    type: String, // 'HH:mm'
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  merchantOrderId: {
    type: String, // UUID generated when initiating payment
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled"],
    default: "Pending",
  },
  paymentDetails: {
    phonepeTransactionId: {
      type: String,
    },
    rawCallback: {
      type: Object, // full webhook payload from PhonePe
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update updatedAt before save
bookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Optional: unique index to prevent double-booking the same time
// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
