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

const cron = require('node-cron');
const dayjs = require('dayjs');
const Booking = require('./models/Booking'); // Adjust the path as necessary

// Existing cron job (optional, you can keep or remove this)
// This job updates pending bookings to expired.
cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled status update job for pending bookings...');
    const timeoutThreshold = dayjs().subtract(15, 'minutes');
    try {
        const result = await Booking.updateMany(
            {
                status: 'Pending',
                createdAt: { $lt: timeoutThreshold.toDate() }
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

// New cron job to delete expired bookings every 3 days.
// The cron expression '0 0 */3 * *' means:
// - 0: at minute 0
// - 0: at hour 0 (midnight)
// - */3: every 3rd day of the month
// - *: any month
// - *: any day of the week
cron.schedule('0 0 */3 * *', async () => {
    console.log('Running scheduled cleanup job for deleting expired bookings...');
    // Define a threshold for how old 'Expired' bookings should be before deletion.
    // E.g., delete bookings that have been expired for at least 24 hours.
    const deletionThreshold = dayjs().subtract(1, 'day');

    try {
        // Find all 'Expired' bookings that were created more than a day ago.
        const result = await Booking.deleteMany({
            status: 'Expired',
            createdAt: { $lt: deletionThreshold.toDate() }
        });

        if (result.deletedCount > 0) {
            console.log(`Cleanup job finished. ${result.deletedCount} expired bookings have been deleted from the database.`);
        } else {
            console.log('Cleanup job finished. No expired bookings found for deletion.');
        }
    } catch (error) {
        console.error("Error running deletion cleanup job:", error);
    }
});

console.log("Cron jobs for booking management have been started.");