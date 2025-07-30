const mongoose = require("mongoose");

const blockedSlotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  timeSlots: [{ type: String }], // empty array => full day blocked
});

blockedSlotSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("BlockedSlot", blockedSlotSchema);

// models/BlockedSlot.js
// const mongoose = require("mongoose");

// const blockedSlotSchema = new mongoose.Schema({
//   date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
//   timeSlots: [{ type: String }], // If empty → full day is blocked
// });

// module.exports = mongoose.model("BlockedSlot", blockedSlotSchema);

