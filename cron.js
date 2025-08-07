// cron.js
const cron = require('node-cron');
const dayjs = require('dayjs');
const Booking = require('./models/Booking'); // Adjust the path as necessary

// Schedule a task to run every 5 minutes.
// The cron expression '*/5 * * * *' means:
// - */5: every 5th minute
// - *: any hour
// - *: any day of the month
// - *: any month
// - *: any day of the week
cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled cleanup job for expired pending bookings...');
    const timeoutThreshold = dayjs().subtract(15, 'minutes');

    try {
        // Find all 'Pending' bookings that were created more than 15 minutes ago.
        const result = await Booking.updateMany(
            {
                status: 'Pending',
                createdAt: { $lt: timeoutThreshold.toDate() }
            },
            {
                status: 'Expired'
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`Cleanup job finished. ${result.modifiedCount} bookings marked as Expired.`);
        } else {
            console.log('Cleanup job finished. No expired pending bookings found.');
        }
    } catch (error) {
        console.error("Error running cleanup job:", error);
    }
});

console.log("Cron job for booking cleanup has been started.");