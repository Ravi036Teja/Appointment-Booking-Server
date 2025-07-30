const Holiday = require("../models/Holiday");
const Booking = require("../models/Booking");
// const User = require("../models/Users");
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({});
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

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

exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findOneAndDelete({ date: req.params.date });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};

// ✅ New controller to fetch blocked data for a specific date
exports.getBlockedByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const data = await Holiday.findOne({ date });
    res.json(data || { blockedSlots: [], fullDay: false });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blocked slots" });
  }
};

// Add a holiday range
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
        date: new Date(currentDate).toISOString().split("T")[0], // 'YYYY-MM-DD'
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

// exports.getDashboardStats = async (req, res) => {
//   try {
//     const totalBookings = await Booking.countDocuments();

//     const upcomingBookings = await Booking.countDocuments({
//       date: { $gte: new Date() },
//     });

//     res.status(200).json({
//       totalBookings,
//       upcomingBookings,
//     });
//   } catch (error) {
//     console.error('Error fetching dashboard stats:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
exports.getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    const upcomingBookings = await Booking.countDocuments({
      date: { $gte: new Date() },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const bookedSlotsToday = await Booking.find({
      date: { $gte: todayStart, $lte: todayEnd }
    }).select('timeSlot -_id');

    const todayBookedSlotCount = bookedSlotsToday.length;

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    const bookingsThisWeek = await Booking.countDocuments({
      date: { $gte: thisWeekStart, $lte: thisWeekEnd }
    });

    res.status(200).json({
      totalBookings,
      upcomingBookings,
      todayBookings,
      todayBookedSlotCount,
      bookingsThisWeek
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


