// controllers/blockedSlotController.js

// const BlockedSlot = require('../models/BlockedSlot');

// // Create or update blocked slots
// exports.blockSlots = async (req, res) => {
//   try {
//     const { date, blockedSlots, fullDay } = req.body;

//     const existing = await BlockedSlot.findOne({ date });

//     if (existing) {
//       existing.blockedSlots = blockedSlots;
//       existing.fullDay = fullDay;
//       await existing.save();
//       return res.status(200).json(existing);
//     }

//     const blocked = await BlockedSlot.create({ date, blockedSlots, fullDay });
//     res.status(201).json(blocked);
//   } catch (error) {
//     res.status(500).json({ message: 'Error blocking slots', error });
//   }
// };

// Get blocked slots by date
// exports.getBlockedByDate = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const blocked = await BlockedSlot.findOne({ date });

//     if (!blocked) return res.json({ fullDay: false, blockedSlots: [] });

//     res.json(blocked);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching blocked data', error });
//   }
// };

// new updated

const BlockedSlot = require("../models/BlockedSlot");

// Block specific slots or full day for a date
exports.blockSlots = async (req, res) => {
  try {
    const { date, timeSlots } = req.body;

    const existing = await BlockedSlot.findOne({ date });

    if (existing) {
      existing.timeSlots = timeSlots;
      await existing.save();
      return res.status(200).json(existing);
    }

    const blocked = await BlockedSlot.create({ date, timeSlots });
    res.status(201).json(blocked);
  } catch (error) {
    res.status(500).json({ message: "Error blocking slots", error });
  }
};

// Get blocked slots by date
exports.getBlockedByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const blocked = await BlockedSlot.findOne({ date });

    if (!blocked) return res.json({ timeSlots: [] });

    res.json(blocked);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blocked data", error });
  }
};

// Get all blocked dates
exports.getAllBlockedDates = async (req, res) => {
  try {
    const all = await BlockedSlot.find();
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocked slots', error });
  }
};


// Block a range of full days (no timeSlots provided)
exports.blockDateRange = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const blockedDates = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      const existing = await BlockedSlot.findOne({ date: dateStr });
      if (!existing) {
        const blocked = await BlockedSlot.create({ date: dateStr, timeSlots: [] });
        blockedDates.push(blocked);
      }
    }

    res.status(201).json({ message: "Dates blocked", blocked: blockedDates });
  } catch (error) {
    res.status(500).json({ message: "Error blocking date range", error });
  }
};

// Delete/unblock a date
exports.deleteBlockedDate = async (req, res) => {
  try {
    const { date } = req.params;
    await BlockedSlot.findOneAndDelete({ date });
    res.json({ success: true, message: "Date unblocked" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blocked date", error });
  }
};

