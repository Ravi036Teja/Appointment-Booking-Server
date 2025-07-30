const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    unique: true,
  },
  blockedSlots: {
    type: [String], // e.g., ['10:00 AM', '10:30 AM']
    default: [],
  },
  fullDay: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Holiday", holidaySchema);


// const mongoose = require("mongoose");

// const holidaySchema = new mongoose.Schema({
//   date: {
//     type: String, // Use ISO date string like '2025-07-28'
//     required: true,
//     unique: true
//   },
// });

// module.exports = mongoose.model("Holiday", holidaySchema);
