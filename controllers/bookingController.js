
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
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(isSameOrBefore);

exports.getAllBookings = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        let query = {};

        if (filter === "today") {
            const todayDateString = dayjs().format('YYYY-MM-DD');
            query.date = todayDateString;
        } else if (filter === "custom" && startDate && endDate) {
            // Use string comparison for custom date range
            query.date = {
                $gte: startDate,
                $lte: endDate,
            };
        }

        const bookings = await Booking.find(query).sort({ date: -1, timeSlot: -1 });
        res.status(200).json(bookings);
    } catch (err) {
        console.error("Error fetching all bookings:", err);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

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