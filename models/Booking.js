// // after phonepe geteway
// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     phone: {
//         type: String,
//         required: true,
//     },
//     date: {
//         type: String, // Stored as 'YYYY-MM-DD'
//         required: true,
//     },
//     timeSlot: {
//         type: String, // Stored as 'HH:mm'
//         required: true,
//     },
//     amount: {
//         type: Number,
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ['Pending', 'Paid', 'Failed', 'Cancelled'],
//         default: 'Pending',
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// module.exports = mongoose.model('Booking', bookingSchema);

// models/Booking.js
const mongoose = require('mongoose');

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
        type: String, // Stored as 'YYYY-MM-DD'
        required: true,
    },
    timeSlot: {
        type: String, // Stored as 'HH:mm'
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Expired', 'Cancelled'],
        default: 'Pending',
    },
    paymentDetails: {
        phonepeTransactionId: {
            type: String,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Update the updatedAt field on every save
bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// This index is crucial for performance and prevents true duplicates, but the `status`-based
// check in your business logic is what handles the temporary lock.
bookingSchema.index({ date: 1, timeSlot: 1 });

module.exports = mongoose.model('Booking', bookingSchema);