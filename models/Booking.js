const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  date: { type: String, required: true },  // Format: YYYY-MM-DD
  timeSlot: { type: String, required: true }, // Format: HH:mm
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
});


bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true }); // Prevent duplicate bookings


module.exports = mongoose.model("Booking", bookingSchema);
