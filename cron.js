// // cron.js
// const cron = require('node-cron');
// const dayjs = require('dayjs');
// const Booking = require('./models/Booking'); // Adjust the path as necessary

// // Schedule a task to run every 5 minutes.
// // The cron expression '*/5 * * * *' means:
// // - */5: every 5th minute
// // - *: any hour
// // - *: any day of the month
// // - *: any month
// // - *: any day of the week
// cron.schedule('*/5 * * * *', async () => {
//     console.log('Running scheduled cleanup job for expired pending bookings...');
//     const timeoutThreshold = dayjs().subtract(15, 'minutes');

//     try {
//         // Find all 'Pending' bookings that were created more than 15 minutes ago.
//         const result = await Booking.updateMany(
//             {
//                 status: 'Pending',
//                 createdAt: { $lt: timeoutThreshold.toDate() }
//             },
//             {
//                 status: 'Expired'
//             }
//         );

//         if (result.modifiedCount > 0) {
//             console.log(`Cleanup job finished. ${result.modifiedCount} bookings marked as Expired.`);
//         } else {
//             console.log('Cleanup job finished. No expired pending bookings found.');
//         }
//     } catch (error) {
//         console.error("Error running cleanup job:", error);
//     }
// });

// console.log("Cron job for booking cleanup has been started.");


// ----------------------------This is the working code---------------------

// const cron = require('node-cron');
// const dayjs = require('dayjs');
// const Booking = require('./models/Booking'); // Adjust the path as necessary
// const { initiateRefund } = require("./services/refundService");

// // Existing cron job (optional, you can keep or remove this)
// // This job updates pending bookings to expired.
// cron.schedule('*/5 * * * *', async () => {
//     console.log('Running scheduled status update job for pending bookings...');
//     const timeoutThreshold = dayjs().subtract(15, 'minutes');
//     try {
//         const result = await Booking.updateMany(
//             {
//                 status: 'Pending',
//                 createdAt: { $lt: timeoutThreshold.toDate() }
//             },
//             {
//                 status: 'Expired'
//             }
//         );
//         console.log(`Status update job finished. ${result.modifiedCount} bookings marked as Expired.`);
//     } catch (error) {
//         console.error("Error running status update job:", error);
//     }
// });

// // New cron job to delete expired bookings every 3 days.
// // The cron expression '0 0 */3 * *' means:
// // - 0: at minute 0
// // - 0: at hour 0 (midnight)
// // - */3: every 3rd day of the month
// // - *: any month
// // - *: any day of the week
// cron.schedule('*/5 * * * *', async () => {
//     console.log('Running scheduled cleanup job for deleting expired bookings...');
//     // Define a threshold for how old 'Expired' bookings should be before deletion.
//     // E.g., delete bookings that have been expired for at least 24 hours.
//     const deletionThreshold = dayjs().subtract(15, 'minutes');

//     try {
//         // Find all 'Expired' bookings that were created more than a day ago.
//         const result = await Booking.deleteMany({
//             status: 'Expired',
//             createdAt: { $lt: deletionThreshold.toDate() }
//         });

//         if (result.deletedCount > 0) {
//             console.log(`Cleanup job finished. ${result.deletedCount} expired bookings have been deleted from the database.`);
//         } else {
//             console.log('Cleanup job finished. No expired bookings found for deletion.');
//         }
//     } catch (error) {
//         console.error("Error running deletion cleanup job:", error);
//     }
// });

// console.log("Cron jobs for booking management have been started.");


// // cronJobs.js



// const setupCronJobs = () => {
//   // This cron job runs every hour
//   cron.schedule("0 * * * *", async () => {
//     console.log("Running scheduled job to check for duplicate paid bookings...");

//     try {
//       // Aggregate to find time slots with more than one 'Paid' booking
//       const duplicateSlots = await Booking.aggregate([
//         {
//           $match: {
//             status: "Paid",
//             // You might want to process only recent bookings to avoid re-checking old data
//             createdAt: { $gt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // Check bookings from the last 48 hours
//           }
//         },
//         {
//           $group: {
//             _id: { date: "$date", timeSlot: "$timeSlot" },
//             count: { $sum: 1 },
//             bookings: { $push: "$$ROOT" }
//           }
//         },
//         {
//           $match: {
//             count: { $gt: 1 } // Only groups with more than one booking
//           }
//         }
//       ]);

//       if (duplicateSlots.length > 0) {
//         console.log(`Found ${duplicateSlots.length} duplicate slot(s). Processing refunds...`);
//         for (const slot of duplicateSlots) {
//           // Sort bookings by creation time to find the latest one (the duplicate)
//           const sortedBookings = slot.bookings.sort((a, b) => b.createdAt - a.createdAt);
//           const duplicateBooking = sortedBookings[0];

//           console.log(`Processing refund for duplicate booking ID: ${duplicateBooking._id} (merchantOrderId: ${duplicateBooking.merchantOrderId})`);
          
//           // Use the refund service to initiate the refund
//           await initiateRefund(duplicateBooking.merchantOrderId);
//         }
//       } else {
//         console.log("No duplicate paid bookings found.");
//       }
//     } catch (error) {
//       console.error("Error in scheduled refund job:", error);
//     }
//   });
// };

// module.exports = {
//   setupCronJobs,
// };







// cron.js

const cron = require('node-cron');
const dayjs = require('dayjs');
const Booking = require('./models/Booking'); // Adjust the path as necessary
const { initiateRefund } = require("./services/refundService"); // Make sure this path is correct

// const setupAllCronJobs = () => {

//     // 1. Cron job to update pending bookings to expired (runs every 5 minutes)
//     cron.schedule('*/5 * * * *', async () => {
//         console.log('Running scheduled status update job for pending bookings...');
//         const timeoutThreshold = dayjs().subtract(15, 'minutes');
//         try {
//             const result = await Booking.updateMany(
//                 {
//                     status: 'Pending',
//                     createdAt: { $lt: timeoutThreshold.toDate() }
//                 },
//                 {
//                     status: 'Expired'
//                 }
//             );
//             console.log(`Status update job finished. ${result.modifiedCount} bookings marked as Expired.`);
//         } catch (error) {
//             console.error("Error running status update job:", error);
//         }
//     });

//     // 2. Cron job to clean up expired bookings (runs every 5 minutes)
//     cron.schedule('*/5 * * * *', async () => {
//         console.log('Running scheduled cleanup job for deleting expired bookings...');
//         const deletionThreshold = dayjs().subtract(15, 'minutes');
//         try {
//             const result = await Booking.deleteMany({
//                 status: 'Expired',
//                 createdAt: { $lt: deletionThreshold.toDate() }
//             });
//             if (result.deletedCount > 0) {
//                 console.log(`Cleanup job finished. ${result.deletedCount} expired bookings have been deleted from the database.`);
//             } else {
//                 console.log('Cleanup job finished. No expired bookings found for deletion.');
//             }
//         } catch (error) {
//             console.error("Error running deletion cleanup job:", error);
//         }
//     });

//     // 3. NEW Cron job for automatic refunds (runs every hour)
    // cron.schedule("0 * * * *", async () => {
    //     console.log("Running scheduled job to check for duplicate paid bookings...");

    //     try {
    //         const duplicateSlots = await Booking.aggregate([
    //             {
    //                 $match: {
    //                     status: "Paid",
    //                     createdAt: { $gt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // Check bookings from the last 48 hours
    //                 }
    //             },
    //             {
    //                 $group: {
    //                     _id: { date: "$date", timeSlot: "$timeSlot" },
    //                     count: { $sum: 1 },
    //                     bookings: { $push: "$$ROOT" }
    //                 }
    //             },
    //             {
    //                 $match: {
    //                     count: { $gt: 1 } // Only groups with more than one booking
    //                 }
    //             }
    //         ]);

    //         if (duplicateSlots.length > 0) {
    //             console.log(`Found ${duplicateSlots.length} duplicate slot(s). Processing refunds...`);
    //             for (const slot of duplicateSlots) {
    //                 // Sort bookings by creation time to find the latest one (the duplicate)
    //                 const sortedBookings = slot.bookings.sort((a, b) => b.createdAt - a.createdAt);
    //                 const duplicateBooking = sortedBookings[0];

    //                 console.log(`Processing refund for duplicate booking ID: ${duplicateBooking._id} (merchantOrderId: ${duplicateBooking.merchantOrderId})`);
                    
    //                 // Use the refund service to initiate the refund
    //                 await initiateRefund(duplicateBooking.merchantOrderId);
    //             }
    //         } else {
    //             console.log("No duplicate paid bookings found.");
    //         }
    //     } catch (error) {
    //         console.error("Error in scheduled refund job:", error);
    //     }
    // });

//     console.log("All cron jobs for booking management have been started.");
// };

// module.exports = {
//     setupAllCronJobs,
// };

const setupAllCronJobs = () => {
    // 1. Corrected cron job to update pending bookings to expired (runs every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running scheduled status update job for pending bookings...');
        try {
            // Find pending bookings where createdAt is more than 10 minutes ago
            // Using a more robust time check to avoid off-by-one errors
            const result = await Booking.updateMany(
                {
                    status: 'Pending',
                    createdAt: { $lt: dayjs().subtract(10, 'minutes').toDate() }
                },
                {
                    status: 'Expired'
                }
            );
            console.log(`Status update job finished. ${result.modifiedCount} bookings marked as Expired.`);
        } catch (error) {
            console.error("Error running status update job:", error);
        }
    });

    // 2. Cron job to clean up expired and failed bookings (runs every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running scheduled cleanup job for deleting expired and failed bookings...');
        try {
            // Find bookings that are 'Expired' or 'Failed' and are older than 10 minutes
            const result = await Booking.deleteMany({
                status: { $in: ['Expired', 'Failed'] },
                createdAt: { $lt: dayjs().subtract(10, 'minutes').toDate() }
            });

            if (result.deletedCount > 0) {
                console.log(`Cleanup job finished. ${result.deletedCount} expired/failed bookings have been deleted from the database.`);
            } else {
                console.log('Cleanup job finished. No expired or failed bookings found for deletion.');
            }
        } catch (error) {
            console.error("Error running deletion cleanup job:", error);
        }
    });


    // 3. NEW Cron job for automatic refunds (runs every hour)
     cron.schedule("0 * * * *", async () => {
        console.log("Running scheduled job to check for duplicate paid bookings...");

        try {
            const duplicateSlots = await Booking.aggregate([
                {
                    $match: {
                        status: "Paid",
                        createdAt: { $gt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // Check bookings from the last 48 hours
                    }
                },
                {
                    $group: {
                        _id: { date: "$date", timeSlot: "$timeSlot" },
                        count: { $sum: 1 },
                        bookings: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 } // Only groups with more than one booking
                    }
                }
            ]);

            if (duplicateSlots.length > 0) {
                console.log(`Found ${duplicateSlots.length} duplicate slot(s). Processing refunds...`);
                for (const slot of duplicateSlots) {
                    // Sort bookings by creation time to find the latest one (the duplicate)
                    const sortedBookings = slot.bookings.sort((a, b) => b.createdAt - a.createdAt);
                    const duplicateBooking = sortedBookings[0];

                    console.log(`Processing refund for duplicate booking ID: ${duplicateBooking._id} (merchantOrderId: ${duplicateBooking.merchantOrderId})`);
                    
                    // Use the refund service to initiate the refund
                    await initiateRefund(duplicateBooking.merchantOrderId);
                }
            } else {
                console.log("No duplicate paid bookings found.");
            }
        } catch (error) {
            console.error("Error in scheduled refund job:", error);
        }
    });

    console.log("All cron jobs for booking management have been started.");
};

module.exports = {
    setupAllCronJobs,
};