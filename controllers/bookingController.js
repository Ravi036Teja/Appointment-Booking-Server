
// const dayjs = require("dayjs");
// const Booking = require("../models/Booking"); // Correct path to your Booking model
// const sendWhatsAppMessage = require("../utils/whatsappSender"); // Ensure this path is correct

// exports.getAllBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
//     res.status(200).json(bookings);
//   } catch (err) {
//     console.error("Error fetching all bookings:", err); // Add logging
//     res.status(500).json({ message: "Failed to fetch bookings" });
//   }
// };

// exports.bookSlot = async (req, res) => {
//   const { date, timeSlot, name, phone } = req.body;

//   try {
//     // Input validation (basic)
//     if (!date || !timeSlot || !name || !phone) {
//       return res.status(400).json({ message: "Missing required booking information." });
//     }
//     if (!/^\d{10,}$/.test(phone)) { // More robust phone validation
//         return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
//     }
//     if (!name.trim() || name.length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
//         return res.status(400).json({ message: "Please enter a valid name (letters and spaces only, min 2 chars)." });
//     }

//     // Prevent booking past time slots (including same day)
//     const now = dayjs();
//     const bookingDateTime = dayjs(`${date} ${timeSlot}`, "YYYY-MM-DD HH:mm");

//     if (bookingDateTime.isBefore(now)) {
//       return res.status(400).json({ message: "Cannot book a past time slot." });
//     }

//     // Check if the slot is already booked (using the unique index ensures this, but a prior check gives a cleaner error message)
//     const existingBooking = await Booking.findOne({ date, timeSlot });
//     if (existingBooking) {
//         return res.status(409).json({ message: "This slot is already taken. Please choose another one." });
//     }

//     // Save booking
//     const newBooking = new Booking({ date, timeSlot, name, phone });
//     await newBooking.save();

//     console.log("Booking saved successfully:", newBooking); // Log success

//     // Send WhatsApp confirmation
//     // Ensure sendWhatsAppMessage is robust or has a try-catch itself
//     // We'll wrap it here just in case, so booking isn't failed by WhatsApp error
//     try {
//         await sendWhatsAppMessage(phone, `🙏 Hi ${name}, your appointment is confirmed for ${date} at ${timeSlot}.`);
//         console.log("WhatsApp message sent successfully for booking:", newBooking._id);
//     } catch (whatsappErr) {
//         console.error("Failed to send WhatsApp message for booking:", newBooking._id, whatsappErr);
//         // Do not return an error here if booking itself was successful,
//         // unless you strictly require WhatsApp message to be sent for booking to be valid.
//         // For now, we'll let the booking succeed even if WhatsApp fails.
//     }


//     res.status(201).json({ success: true, message: "Booking confirmed" });
//   } catch (error) {
//     console.error("Error during bookSlot:", error); // Log the actual error for debugging

//     if (error.code === 11000) {
//       // Duplicate key error
//       return res.status(409).json({ message: "Slot already booked by another user. Please choose a different time." });
//     }
//     if (error.name === 'ValidationError') {
//         // Mongoose validation error (e.g., required fields missing from schema, type mismatch)
//         const errors = Object.values(error.errors).map(err => err.message);
//         return res.status(400).json({ message: "Booking validation failed", errors: errors });
//     }
//     res.status(500).json({ message: "Server error during booking. Please try again later." });
//   }
// };

// exports.getBookedSlots = async (req, res) => {
//   const { date } = req.params;
//   try {
//     const bookings = await Booking.find({ date });
//     const slots = bookings.map((b) => b.timeSlot);
//     res.json(slots);
//   } catch (error) {
//     console.error("Error fetching booked slots:", error); // Add logging
//     res.status(500).json({ message: "Failed to get slots" });
//   }
// };

// // after phonepe gatway
// exports.createBooking = async (req, res) => {
//   const { name, phone, date, time } = req.body;

//   // Save to DB (Mocked here)
//   try {
//     console.log("Booking confirmed for:", name, date, time);
//     res.status(200).json({ message: "Booking confirmed" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to save booking" });
//   }
// };

// gemini code
const Booking = require("../models/Booking"); // Correct path to your Booking model

/**
 * Controller to fetch all bookings from the database.
 * This is typically used for an admin dashboard.
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

/**
 * Controller to fetch all booked time slots for a specific date.
 * This is used by the frontend to gray out unavailable slots.
 */
exports.getBookedSlots = async (req, res) => {
  const { date } = req.params;
  try {
    // We only need to check for 'Paid' and 'Pending' bookings to disable slots.
    // 'Pending' bookings are important to prevent double-booking while a user is on the payment page.
    const bookings = await Booking.find({ 
      date, 
      status: { $in: ['Paid', 'Pending'] } 
    });
    const slots = bookings.map((b) => b.timeSlot);
    res.json(slots);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ message: "Failed to get slots" });
  }
};

// --- Note on Removed Functions ---
// The old 'bookSlot' function has been replaced by the payment flow logic.
// - The initial 'Pending' booking creation is now in backend/routes/phonepeRoutes.js
// - The final booking confirmation and status update is now in backend/routes/phonepeRoutes.js after the payment callback.
// The 'createBooking' function is no longer necessary as the logic is now handled by the payment callback.