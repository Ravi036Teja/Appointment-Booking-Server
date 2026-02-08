// // models/Booking.js
// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   date: { type: String, required: true }, // YYYY-MM-DD
//   timeSlot: { type: String, required: true }, // HH:mm
//   amount: { type: Number, required: true },
  
//   // New field to prevent race conditions
//   isHeld: { type: Boolean, default: false },

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


// // Create a unique index for date and timeSlot
// bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

// module.exports = mongoose.model("Booking", bookingSchema);





const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // HH:mm
    amount: { type: Number, required: true },
    
    merchantOrderId: { type: String, required: true, unique: true },

    // Add a field for the time the reservation expires
    expiresAt: { type: Date, required: false },

    status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled", "Reserved"],
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
    
    frontendUrl: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create a unique index for date and timeSlot
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

// Add a TTL index to automatically delete expired reservations
// This will automatically delete documents where `expiresAt` is older than `0` seconds
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Booking", bookingSchema);