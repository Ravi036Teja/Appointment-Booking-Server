const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  merchantTransactionId: { type: String, unique: true, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  amount: Number,
  status: { type: String, enum: ['PENDING','SUCCESS','FAIL'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Payment', paymentSchema);
