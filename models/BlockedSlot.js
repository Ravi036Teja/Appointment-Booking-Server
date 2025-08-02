// const mongoose = require("mongoose");

// const blockedSlotSchema = new mongoose.Schema({
//   date: { type: String, required: true },
//   timeSlots: [{ type: String }], // empty array => full day blocked
// });

// blockedSlotSchema.index({ date: 1 }, { unique: true });

// module.exports = mongoose.model("BlockedSlot", blockedSlotSchema);

// backend/models/BlockedSlot.js
const mongoose = require("mongoose");

const blockedSlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    index: true,
    unique: true // A date can only be blocked once
  },
  timeSlots: [{
    type: String
  }], // empty array => full day blocked
  // --- NEW FIELD ---
  message: {
    type: String,
    trim: true,
    default: "This date is unavailable. Please choose another day." // Default message for users
  },
  createdAt: { // Optional: Add a timestamp for tracking when it was blocked
    type: Date,
    default: Date.now,
  },
});

// blockedSlotSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("BlockedSlot", blockedSlotSchema);
