
const dayjs = require("dayjs");
const Booking = require("../models/Booking");
const sendWhatsAppMessage = require("../utils/whatsappSender");

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

exports.bookSlot = async (req, res) => {
  const { date, timeSlot, name, phone } = req.body;

  try {
    // Prevent booking past time slots (including same day)
    const now = dayjs();
    const bookingDateTime = dayjs(`${date} ${timeSlot}`, "YYYY-MM-DD HH:mm");

    if (bookingDateTime.isBefore(now)) {
      return res.status(400).json({ message: "Cannot book a past time slot." });
    }

    // Save booking
    const newBooking = new Booking({ date, timeSlot, name, phone });
    await newBooking.save();

    // Send WhatsApp confirmation
    await sendWhatsAppMessage(phone, `🙏 Hi ${name}, your appointment is confirmed for ${date} at ${timeSlot}.`);

    res.status(201).json({ success: true, message: "Booking confirmed" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slot already booked" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookedSlots = async (req, res) => {
  const { date } = req.params;
  try {
    const bookings = await Booking.find({ date });
    const slots = bookings.map((b) => b.timeSlot);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: "Failed to get slots" });
  }
};