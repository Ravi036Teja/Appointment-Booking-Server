// const Holiday = require("../models/Holiday");
// const Booking = require("../models/Booking");
// // const User = require("../models/Users");
// exports.getHolidays = async (req, res) => {
//   try {
//     const holidays = await Holiday.find({});
//     res.json(holidays);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch holidays" });
//   }
// };

// exports.addHoliday = async (req, res) => {
//   const { date, blockedSlots, fullDay } = req.body;

//   try {
//     const holiday = await Holiday.findOneAndUpdate(
//       { date },
//       {
//         $set: {
//           blockedSlots: blockedSlots || [],
//           fullDay: !!fullDay,
//         },
//       },
//       { upsert: true, new: true }
//     );
//     res.status(201).json({ success: true, holiday });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to add holiday" });
//   }
// };

// exports.deleteHoliday = async (req, res) => {
//   try {
//     await Holiday.findOneAndDelete({ date: req.params.date });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to delete holiday" });
//   }
// };

// // ✅ New controller to fetch blocked data for a specific date
// exports.getBlockedByDate = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const data = await Holiday.findOne({ date });
//     res.json(data || { blockedSlots: [], fullDay: false });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch blocked slots" });
//   }
// };

// // Add a holiday range
// exports.addHolidayRange = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;

//     if (!startDate || !endDate) {
//       return res.status(400).json({ message: "Start and end dates required" });
//     }

//     const currentDate = new Date(startDate);
//     const finalDate = new Date(endDate);

//     const holidays = [];

//     while (currentDate <= finalDate) {
//       holidays.push({
//         date: new Date(currentDate).toISOString().split("T")[0], // 'YYYY-MM-DD'
//       });
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     await Holiday.insertMany(holidays);

//     res.status(201).json({ message: "Holiday range added", holidays });
//   } catch (error) {
//     console.error("Error adding holiday range:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // exports.getDashboardStats = async (req, res) => {
// //   try {
// //     const totalBookings = await Booking.countDocuments();

// //     const upcomingBookings = await Booking.countDocuments({
// //       date: { $gte: new Date() },
// //     });

// //     res.status(200).json({
// //       totalBookings,
// //       upcomingBookings,
// //     });
// //   } catch (error) {
// //     console.error('Error fetching dashboard stats:', error);
// //     res.status(500).json({ message: 'Internal server error' });
// //   }
// // };
// exports.getDashboardStats = async (req, res) => {
//   try {
//     const totalBookings = await Booking.countDocuments();

//     const upcomingBookings = await Booking.countDocuments({
//       date: { $gte: new Date() },
//     });

//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);

//     const todayBookings = await Booking.countDocuments({
//       date: { $gte: todayStart, $lte: todayEnd }
//     });

//     const bookedSlotsToday = await Booking.find({
//       date: { $gte: todayStart, $lte: todayEnd }
//     }).select('timeSlot -_id');

//     const todayBookedSlotCount = bookedSlotsToday.length;

//     const thisWeekStart = new Date();
//     thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
//     thisWeekStart.setHours(0, 0, 0, 0);

//     const thisWeekEnd = new Date(thisWeekStart);
//     thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
//     thisWeekEnd.setHours(23, 59, 59, 999);

//     const bookingsThisWeek = await Booking.countDocuments({
//       date: { $gte: thisWeekStart, $lte: thisWeekEnd }
//     });

//     res.status(200).json({
//       totalBookings,
//       upcomingBookings,
//       todayBookings,
//       todayBookedSlotCount,
//       bookingsThisWeek
//     });
//   } catch (error) {
//     console.error('Error fetching dashboard stats:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };




const Holiday = require("../models/Holiday");
const Booking = require("../models/Booking");

// Get all holidays
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({});
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

// Add or update a single holiday
exports.addHoliday = async (req, res) => {
  const { date, blockedSlots, fullDay } = req.body;

  try {
    const holiday = await Holiday.findOneAndUpdate(
      { date },
      {
        $set: {
          blockedSlots: blockedSlots || [],
          fullDay: !!fullDay,
        },
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, holiday });
  } catch (err) {
    res.status(500).json({ message: "Failed to add holiday" });
  }
};

// Delete holiday by date
exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findOneAndDelete({ date: req.params.date });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};

// Get blocked slots and full-day info for a specific date
exports.getBlockedByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const data = await Holiday.findOne({ date });
    res.json(data || { blockedSlots: [], fullDay: false });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blocked slots" });
  }
};

// Add a holiday for a range of dates
exports.addHolidayRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end dates required" });
    }

    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);
    const holidays = [];

    while (currentDate <= finalDate) {
      holidays.push({
        date: new Date(currentDate).toISOString().split("T")[0],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await Holiday.insertMany(holidays);
    res.status(201).json({ message: "Holiday range added", holidays });
  } catch (error) {
    console.error("Error adding holiday range:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Dashboard stats for admin
exports.getDashboardStats = async (req, res) => {
  try {
    const allBookings = await Booking.find();
    const now = new Date();

    const totalBookings = allBookings.length;

    const upcomingBookings = allBookings.filter((booking) => {
      const slotTime = new Date(`${booking.date}T${booking.time}:00`);
      return slotTime > now;
    }).length;

    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
    const todayBookings = allBookings.filter((booking) => booking.date === today).length;

    res.json({
      totalBookings,
      upcomingBookings,
      todayBookings,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

// exports.getDashboardStats = async (req, res) => {
//   try {
//     const allBookings = await Booking.find();
//     const now = new Date();
//     const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

//     console.log("NOW:", now);
//     console.log("TODAY STRING:", today);
//     console.log("---- BOOKINGS ----");
//     allBookings.forEach((b) => {
//       console.log(`Date: ${b.date} | Time: ${b.time}`);
//     });

//     const totalBookings = allBookings.length;

//     const upcomingBookings = allBookings.filter((booking) => {
//       const slotTime = new Date(`${booking.date}T${booking.time}:00`);
//       return slotTime > now;
//     }).length;

//     const todayBookings = allBookings.filter((booking) => booking.date === today).length;

//     res.json({
//       totalBookings,
//       upcomingBookings,
//       todayBookings,
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     res.status(500).json({ message: "Error fetching dashboard stats" });
//   }
// };
