// const Holiday = require("../models/Holiday");
// const Booking = require("../models/Booking");
// const dayjs = require("dayjs"); 
// // Get all holidays
// exports.getHolidays = async (req, res) => {
//   try {
//     const holidays = await Holiday.find({});
//     res.json(holidays);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch holidays" });
//   }
// };

// // Add or update a single holiday
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

// // Delete holiday by date
// exports.deleteHoliday = async (req, res) => {
//   try {
//     await Holiday.findOneAndDelete({ date: req.params.date });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to delete holiday" });
//   }
// };

// // Get blocked slots and full-day info for a specific date
// exports.getBlockedByDate = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const data = await Holiday.findOne({ date });
//     res.json(data || { blockedSlots: [], fullDay: false });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch blocked slots" });
//   }
// };

// // Add a holiday for a range of dates
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
//         date: new Date(currentDate).toISOString().split("T")[0],
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

// // Dashboard stats for admin
// // exports.getDashboardStats = async (req, res) => {
// //   try {
// //     const allBookings = await Booking.find();
// //     const now = new Date();

// //     const totalBookings = allBookings.length;

// //     const upcomingBookings = allBookings.filter((booking) => {
// //       const slotTime = new Date(`${booking.date}T${booking.time}:00`);
// //       return slotTime > now;
// //     }).length;

// //     const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
// //     const todayBookings = allBookings.filter((booking) => booking.date === today).length;

// //     res.json({
// //       totalBookings,
// //       upcomingBookings,
// //       todayBookings,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching dashboard stats:", error);
// //     res.status(500).json({ message: "Error fetching dashboard stats" });
// //   }
// // };

// exports.getDashboardStats = async (req, res) => {
//   try {
//     const allBookings = await Booking.find();
//     const now = new Date();
//     const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

//     const totalBookings = allBookings.length;

//     const upcomingBookings = allBookings.filter((booking) => {
//       // Assuming booking.time is "HH:mm"
//       const slotTime = new Date(`${booking.date}T${booking.timeSlot}:00`); // Use timeSlot from your booking model
//       return slotTime > now;
//     }).length;

//     const todayBookings = allBookings.filter((booking) => booking.date === today).length;

//     // We are NOT calculating or sending revenue/averageRating from the backend here.
//     // The frontend will use its default useState values (0 for revenue, 0 for averageRating)
//     // and handle rendering gracefully with optional chaining.

//     res.json({
//       totalBookings,
//       upcomingBookings,
//       todayBookings,
//       // OMITTING 'revenue' and 'averageRating' here
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     res.status(500).json({ message: "Error fetching dashboard stats" });
//   }
// };
// // NEW: Get Daily Booking Counts for Chart
// exports.getDailyBookingsChart = async (req, res) => {
//     try {
//         const days = 30; // Last 30 days
//         const dailyData = [];
//         const today = dayjs(); // This is where dayjs is used, so it needs to be defined here.

//         for (let i = days - 1; i >= 0; i--) {
//             const date = today.subtract(i, 'day').format('YYYY-MM-DD');
//             const bookingsCount = await Booking.countDocuments({ date: date });
//             dailyData.push({
//                 date: dayjs(date).format('DD MMM'), // And here
//                 bookings: bookingsCount
//             });
//         }
//         res.json(dailyData);
//     } catch (error) {
//         console.error("Error fetching daily bookings for chart:", error);
//         res.status(500).json({ message: "Error fetching daily chart data" });
//     }
// };

// // NEW: Get Weekly Booking Counts for Chart
// exports.getWeeklyBookingsChart = async (req, res) => {
//     try {
//         const weeks = 12; // Last 12 weeks
//         const weeklyData = [];
//         const today = dayjs(); // And here

//         for (let i = weeks - 1; i >= 0; i--) {
//             const startOfWeek = today.subtract(i, 'week').startOf('week').format('YYYY-MM-DD');
//             const endOfWeek = today.subtract(i, 'week').endOf('week').format('YYYY-MM-DD');

//             const bookingsCount = await Booking.countDocuments({
//                 date: {
//                     $gte: startOfWeek,
//                     $lte: endOfWeek
//                 }
//             });
//             weeklyData.push({
//                 week: `Week ${weeks - i}`,
//                 bookings: bookingsCount
//             });
//         }
//         res.json(weeklyData);
//     } catch (error) {
//         console.error("Error fetching weekly bookings for chart:", error);
//         res.status(500).json({ message: "Error fetching weekly chart data" });
//     }
// };

// // NEW: Get Monthly Booking Counts for Chart
// exports.getMonthlyBookingsChart = async (req, res) => {
//     try {
//         const months = 12; // Last 12 months
//         const monthlyData = [];
//         const today = dayjs(); // And here

//         for (let i = months - 1; i >= 0; i--) {
//             const monthStart = today.subtract(i, 'month').startOf('month').format('YYYY-MM-DD');
//             const monthEnd = today.subtract(i, 'month').endOf('month').format('YYYY-MM-DD');
//             const monthName = today.subtract(i, 'month').format('MMM');

//             const bookingsCount = await Booking.countDocuments({
//                 date: {
//                     $gte: monthStart,
//                     $lte: monthEnd
//                 }
//             });
//             monthlyData.push({
//                 month: monthName,
//                 bookings: bookingsCount
//             });
//         }
//         res.json(monthlyData);
//     } catch (error) {
//         console.error("Error fetching monthly bookings for chart:", error);
//         res.status(500).json({ message: "Error fetching monthly chart data" });
//     }
// };
const Booking = require("../models/Booking");
const dayjs = require("dayjs");

const getBlockedByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const data = await Holiday.findOne({ date });
    res.json(data || { blockedSlots: [], fullDay: false });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blocked slots" });
  }
};

// Get overall dashboard stats for paid bookings
const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ status: "Paid" });

    // Upcoming bookings: future dates, paid
    const today = dayjs().startOf("day").toDate();
    const upcomingBookings = await Booking.countDocuments({
      status: "Paid",
      date: { $gte: dayjs(today).format("YYYY-MM-DD") },
    });

    // Today's bookings: paid and date = today
    const todayBookings = await Booking.countDocuments({
      status: "Paid",
      date: dayjs(today).format("YYYY-MM-DD"),
    });

    // Total revenue from paid bookings
    const revenueAgg = await Booking.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.status(200).json({
      totalBookings,
      upcomingBookings,
      todayBookings,
      revenue,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to get dashboard stats" });
  }
};

// Helper function for grouping by date/week/month
// const groupBookings = async (period) => {
//   let groupId = {};
//   let projectId = {};

//   switch (period) {
//     case "daily":
//       groupId = { date: "$date" };
//       projectId = { date: "$_id.date" };
//       break;
//     case "weekly":
//       groupId = {
//         year: { $year: { $toDate: "$date" } },
//         week: { $week: { $toDate: "$date" } },
//       };
//       projectId = {
//         week: {
//           $concat: [
//             { $toString: "$_id.year" },
//             "-W",
//             { $toString: "$_id.week" },
//           ],
//         },
//       };
//       break;
//     case "monthly":
//       groupId = {
//         year: { $year: { $toDate: "$date" } },
//         month: { $month: { $toDate: "$date" } },
//       };
//       projectId = {
//         month: {
//           $concat: [
//             { $toString: "$_id.year" },
//             "-",
//             {
//               $cond: [
//                 { $lt: ["$_id.month", 10] },
//                 { $concat: ["0", { $toString: "$_id.month" }] },
//                 { $toString: "$_id.month" },
//               ],
//             },
//           ],
//         },
//       };
//       break;
//     default:
//       throw new Error("Invalid period");
//   }

//   const agg = await Booking.aggregate([
//     { $match: { status: "Paid" } },
//     {
//       $group: {
//         _id: groupId,
//         bookings: { $sum: 1 },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         ...projectId,
//         bookings: 1,
//       },
//     },
//     { $sort: { [Object.keys(projectId)[0]]: 1 } },
//   ]);
//   return agg;
// };
const groupBookings = async (period) => {
  let groupId = {};
  let projectId = {};

  switch (period) {
    case "daily":
      groupId = { date: "$date" };
      projectId = { date: "$_id.date" };
      break;
    case "weekly":
      groupId = {
        year: { $year: { $toDate: "$date" } },
        week: { $week: { $toDate: "$date" } },
      };
      projectId = {
        week: {
          $concat: [
            { $toString: "$_id.year" },
            "-W",
            { $toString: "$_id.week" }
          ],
        },
      };
      break;
    case "monthly":
      groupId = {
        year: { $year: { $toDate: "$date" } },
        month: { $month: { $toDate: "$date" } },
      };
      projectId = {
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            {
              $cond: [
                { $lt: ["$_id.month", 10] },
                { $concat: ["0", { $toString: "$_id.month" }] },
                { $toString: "$_id.month" },
              ],
            },
          ],
        },
      };
      break;
    default:
      throw new Error("Invalid period");
  }

  const agg = await Booking.aggregate([
    { $match: { status: "Paid" } },
    {
      $group: {
        _id: groupId,
        bookings: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        ...projectId,
        bookings: 1,
        revenue: 1,
      },
    },
    { $sort: { [Object.keys(projectId)[0]]: 1 } },
  ]);
  return agg;
};


const getDailyBookings = async (req, res) => {
  try {
    const daily = await groupBookings("daily");
    res.status(200).json(daily);
  } catch (error) {
    console.error("Error fetching daily bookings:", error);
    res.status(500).json({ message: "Failed to get daily bookings" });
  }
};

const getWeeklyBookings = async (req, res) => {
  try {
    const weekly = await groupBookings("weekly");
    res.status(200).json(weekly);
  } catch (error) {
    console.error("Error fetching weekly bookings:", error);
    res.status(500).json({ message: "Failed to get weekly bookings" });
  }
};

const getMonthlyBookings = async (req, res) => {
  try {
    const monthly = await groupBookings("monthly");
    res.status(200).json(monthly);
  } catch (error) {
    console.error("Error fetching monthly bookings:", error);
    res.status(500).json({ message: "Failed to get monthly bookings" });
  }
};

module.exports = {
  getBlockedByDate,
  getDashboardStats,
  getDailyBookings,
  getWeeklyBookings,
  getMonthlyBookings,
};
