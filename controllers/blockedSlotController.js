// // backend/controllers/blockedSlotController.js
// const BlockedSlot = require("../models/BlockedSlot");
// const Booking = require("../models/Booking"); // <--- NEW: Import Booking model

// // Block specific slots or full day for a date
// // @route   POST /api/blocked/block
// // @access  Private/Admin
// exports.blockSlots = async (req, res) => {
//   try {
//     const { date, timeSlots, message } = req.body; // <--- NEW: message

//     if (!date) {
//       return res.status(400).json({ message: "Date is required." });
//     }

//     // --- NEW: Check for existing bookings on that date ---
//     const existingBookings = await Booking.countDocuments({ date });
//     if (existingBookings > 0) {
//       return res.status(400).json({
//         message: `Cannot block ${date}. There are ${existingBookings} existing booking(s) on this day. Please clear bookings first or choose another date.`,
//         hasBookings: true
//       });
//     }
//     // ----------------------------------------------------

//     const existingBlocked = await BlockedSlot.findOne({ date });

//     if (existingBlocked) {
//       // If already blocked, update its timeSlots and message
//       existingBlocked.timeSlots = timeSlots || []; // Ensure it's an array
//       existingBlocked.message = message || "This date is unavailable. Please choose another day."; // Update message
//       await existingBlocked.save();
//       return res.status(200).json(existingBlocked);
//     }

//     // Create new blocked entry
//     const newBlocked = await BlockedSlot.create({
//       date,
//       timeSlots: timeSlots || [], // Ensure it's an array
//       message: message || "This date is unavailable. Please choose another day." // Save message
//     });
//     res.status(201).json(newBlocked);

//   } catch (error) {
//     console.error("Error blocking slots:", error); // Log the actual error
//     if (error.code === 11000) { // MongoDB duplicate key error (if date already exists)
//       return res.status(409).json({ message: "This date is already blocked." });
//     }
//     res.status(500).json({ message: "Server error during blocking slots", error: error.message });
//   }
// };

// // Get blocked slots by date
// // @route   GET /api/blocked/:date
// // @access  Public (for user-facing pages)
// exports.getBlockedByDate = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const blocked = await BlockedSlot.findOne({ date });

//     if (!blocked) {
//       return res.json({ timeSlots: [], message: "", isBlocked: false }); // Indicate not blocked
//     }

//     res.json({
//       timeSlots: blocked.timeSlots,
//       message: blocked.message,
//       isBlocked: true,
//     });
//   } catch (error) {
//     console.error("Error fetching blocked data:", error);
//     res.status(500).json({ message: "Error fetching blocked data", error: error.message });
//   }
// };

// // Get all blocked dates
// // @route   GET /api/blocked/
// // @access  Private/Admin
// exports.getAllBlockedDates = async (req, res) => {
//   try {
//     const all = await BlockedSlot.find().sort({ date: 1 }); // Sort by date for better display
//     res.json(all);
//   } catch (error) {
//     console.error('Error fetching all blocked slots:', error);
//     res.status(500).json({ message: 'Error fetching blocked slots', error: error.message });
//   }
// };

// // Delete/unblock a date
// // @route   DELETE /api/blocked/:date
// // @access  Private/Admin
// exports.deleteBlockedDate = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const deleted = await BlockedSlot.findOneAndDelete({ date });

//     if (!deleted) {
//       return res.status(404).json({ message: "Blocked date not found." });
//     }

//     res.json({ success: true, message: "Date unblocked successfully" });
//   } catch (error) {
//     console.error("Error deleting blocked date:", error);
//     res.status(500).json({ message: "Server error deleting blocked date", error: error.message });
//   }
// };

// // Note: blockDateRange from your provided code wasn't directly used by the frontend.
// // If you want to use it, you'd need a frontend component to utilize it.
// // For now, I'm focusing on aligning with the AdminSlotControlPage.
// // If you uncommented that, ensure it's exported and a route exists for it.
// // exports.blockDateRange = async (req, res) => { /* ... */ };


const BlockedSlot = require("../models/BlockedSlot");
const Booking = require("../models/Booking");

// Block specific slots or full day for a date
// @route   POST /api/blocked/block
// @access  Private/Admin
exports.blockSlots = async (req, res) => {
  try {
    const { date, timeSlots, message } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    // Determine if it is a full day block or partial block
    const isFullDayBlock = !timeSlots || timeSlots.length === 0;

    // --- SAFETY CHECK: Check for existing bookings on that date ---
    const existingBookingsQuery = { date };

    // If it's a partial block, check only for bookings within the *slots being blocked*
    if (!isFullDayBlock && timeSlots && timeSlots.length > 0) {
        existingBookingsQuery.timeSlot = { $in: timeSlots };
    } 
    // If it's a full-day block, the query checks the whole date

    const existingBookingsCount = await Booking.countDocuments(existingBookingsQuery);
    
    if (existingBookingsCount > 0) {
        const slotsDetail = isFullDayBlock ? "on this day" : `in the selected time slot(s): ${timeSlots.join(", ")}`;

        return res.status(400).json({
            message: `Cannot block ${date}. There are ${existingBookingsCount} existing booking(s) ${slotsDetail}. Please clear bookings or choose another date/slots.`,
            hasBookings: true
        });
    }
    // ------------------------------------------------------------------

    // Find if an entry for this date already exists
    let existingBlocked = await BlockedSlot.findOne({ date });

    if (existingBlocked) {
      // If already blocked, update its timeSlots and message
      existingBlocked.timeSlots = timeSlots || []; // Ensure it's an array
      // Only update message if a new one is provided, otherwise keep the old one
      existingBlocked.message = message !== undefined ? message.trim() || "This date is unavailable. Please choose another day." : existingBlocked.message;
      await existingBlocked.save();
      return res.status(200).json(existingBlocked);
    }

    // Create new blocked entry
    const newBlocked = await BlockedSlot.create({
      date,
      timeSlots: timeSlots || [],
      message: message !== undefined ? message.trim() : "This date/slot is unavailable. Please choose another day/slot."
    });
    res.status(201).json(newBlocked);

  } catch (error) {
    console.error("Error blocking slots:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "This date is already blocked." });
    }
    res.status(500).json({ message: "Server error during blocking slots", error: error.message });
  }
};

// The rest of the controller functions remain largely the same, but are included for completeness:

// Get blocked slots by date
// @route   GET /api/blocked/:date
// @access  Public (for user-facing pages)
exports.getBlockedByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const blocked = await BlockedSlot.findOne({ date });

    if (!blocked) {
      return res.json({ timeSlots: [], message: "", isBlocked: false });
    }

    res.json({
      timeSlots: blocked.timeSlots,
      message: blocked.message,
      isBlocked: true,
    });
  } catch (error) {
    console.error("Error fetching blocked data:", error);
    res.status(500).json({ message: "Error fetching blocked data", error: error.message });
  }
};

// Get all blocked dates
// @route   GET /api/blocked/
// @access  Private/Admin
exports.getAllBlockedDates = async (req, res) => {
  try {
    const all = await BlockedSlot.find().sort({ date: 1 });
    res.json(all);
  } catch (error) {
    console.error('Error fetching all blocked slots:', error);
    res.status(500).json({ message: 'Error fetching blocked slots', error: error.message });
  }
};

// Delete/unblock a date
// @route   DELETE /api/blocked/:date
// @access  Private/Admin
exports.deleteBlockedDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Check for any bookings on the date before allowing unblock
    const existingBookings = await Booking.countDocuments({ date });
    if (existingBookings > 0) {
        return res.status(400).json({
            message: `Cannot unblock ${date}. There are ${existingBookings} existing booking(s) on this day. Please clear or move bookings first.`,
            hasBookings: true
        });
    }

    const deleted = await BlockedSlot.findOneAndDelete({ date });

    if (!deleted) {
      return res.status(404).json({ message: "Blocked date not found." });
    }

    res.json({ success: true, message: "Date unblocked successfully" });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    res.status(500).json({ message: "Server error deleting blocked date", error: error.message });
  }
};