
// const dayjs = require("dayjs");
// const Booking = require("../models/Booking");
// const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
// dayjs.extend(isSameOrBefore);

// // This function is for your admin panel or API to fetch all bookings.
// exports.getAllBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 });
//         res.status(200).json(bookings);
//     } catch (err) {
//         console.error("Error fetching all bookings:", err);
//         res.status(500).json({ message: "Failed to fetch bookings" });
//     }
// };

// // This function is for your frontend to check for available slots.
// exports.getBookedSlots = async (req, res) => {
//     const { date } = req.params;
//     try {
//         const bookings = await Booking.find({ 
//             date, 
//             status: { $in: ["Paid", "Pending"] } 
//         });
//         const slots = bookings.map((b) => b.timeSlot);
//         res.json(slots);
//     } catch (error) {
//         console.error("Error fetching booked slots:", error);
//         res.status(500).json({ message: "Failed to get slots" });
//     }
// };

// // **NEW:** Endpoint to get a single booking by ID.
// exports.getBookingById = async (req, res) => {
//     try {
//         const booking = await Booking.findById(req.params.id);
//         if (!booking) {
//             return res.status(404).json({ message: "Booking not found" });
//         }
//         res.status(200).json(booking);
//     } catch (error) {
//         console.error("Error fetching booking details:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

const dayjs = require("dayjs");
const Booking = require("../models/Booking");
const User = require("../models/Users.Model"); // Import the User model
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(isSameOrBefore);

// **NEW:** Create a new booking
exports.createBooking = async (req, res) => {
  const { date, timeSlot, amount, merchantOrderId, status } = req.body;
  const userId = req.user._id; // Get user ID from the authenticated request

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create the booking with a reference to the user
    const newBooking = new Booking({
      date,
      timeSlot,
      amount,
      merchantOrderId,
      status,
      user: userId,
      // You don't need to pass name and phone here anymore, as it's linked to the user
    });

    const savedBooking = await newBooking.save();

    // Link the new booking to the user's bookings array
    user.bookings.push(savedBooking._id);
    await user.save();

    // Respond with the populated booking details
    const populatedBooking = await savedBooking.populate('user', 'name email phone').execPopulate();

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
};

// Update existing functions to use populate
// This function is for your admin panel or API to fetch all bookings.
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone') // Populate the user field
      .sort({ date: -1, timeSlot: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// This function is for your frontend to check for available slots.
exports.getBookedSlots = async (req, res) => {
  const { date } = req.params;
  try {
    const bookings = await Booking.find({
      date,
      status: { $in: ["Paid", "Pending"] },
    });
    const slots = bookings.map((b) => b.timeSlot);
    res.json(slots);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ message: "Failed to get slots" });
  }
};

// Endpoint to get a single booking by ID.
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone'); // Populate the user field
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Server error" });
  }
};