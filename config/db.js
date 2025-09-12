const mongoose = require("mongoose");
const { setupAllCronJobs } = require('../cron');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
     // Call the function to set up all cron jobs after a successful DB connection
    setupAllCronJobs(); 
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
