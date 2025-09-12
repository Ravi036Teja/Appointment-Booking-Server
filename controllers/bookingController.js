
const dayjs = require("dayjs");
const Booking = require("../models/Booking");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(isSameOrBefore);

// This function is for your admin panel or API to fetch all bookings.
// This function is for your admin panel or API to fetch all bookings.
exports.getAllBookings = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;
        let query = {};

        // Apply filtering based on the 'date' field from the query parameters
        if (date) {
            // For a single date (e.g., "today")
            query.date = date;
        } else if (startDate && endDate) {
            // For a custom date range
            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Fetch bookings based on the constructed query
        const bookings = await Booking.find(query).sort({ date: -1, timeSlot: -1 });

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
            status: { $in: ["Paid", "Pending"] } 
        });
        const slots = bookings.map((b) => b.timeSlot);
        res.json(slots);
    } catch (error) {
        console.error("Error fetching booked slots:", error);
        res.status(500).json({ message: "Failed to get slots" });
    }
};

// **NEW:** Endpoint to get a single booking by ID.
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.updateRefundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { refundStatus } = req.body;

    // ✅ Allow only valid enum values from the model
    const allowedStatuses = ["Not Refunded", "Refund Initiated", "Refunded", "Refund Failed"];
    if (!allowedStatuses.includes(refundStatus)) {
      return res.status(400).json({ message: "Invalid refund status" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.refundStatus = refundStatus;
    if (!booking.refundDetails) booking.refundDetails = {};
    booking.refundDetails.updatedAt = new Date();

    await booking.save();

    res.status(200).json({
      message: "Refund status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating refund status:", error);
    res.status(500).json({ message: "Failed to update refund status" });
  }
};

exports.getBookingByMerchantOrderId = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      merchantOrderId: req.params.merchantOrderId,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};
