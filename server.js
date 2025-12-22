const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require('http'); // Import the built-in http module
const { Server } = require("socket.io"); // Import Server from socket.io
const connectDB = require("./config/db");
const path = require('path');
connectDB();
//  Require the cron job file to start the scheduler
// const { setupAllCronJobs } = require('./cron'); 
// require('./cron');

const app = express();
const server = http.createServer(app); // Create an HTTP server from your Express app

// Attach socket.io to the HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // Allow your frontend to connect
        methods: ["GET", "POST"]
    }
});

// Make the socket.io instance available to your routes
app.set('io', io);


app.use(cors());

// Wake-up route for Render (public, no auth needed)
app.get('/wake', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'JAPL Backend is awake and running!',
    timestamp: new Date().toISOString()
  });
});


//  RAW body only for PhonePe webhook
app.use('/api/phonepe/phonepe-callback', express.raw({ type: '*/*' }));

//  JSON parser for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", require("./routes/bookingRoute"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/blocked", require("./routes/blockedSlotRoute"));
app.use('/api/gallery', require("./routes/ImageRoutes"));
app.use('/api/phonepe', require("./routes/phonepeRoutes"));
app.use("/api/feedback",  require("./routes/feedbackRoute"));
app.use("/api/users", require("./routes/userRoutes"));

// Root route
app.get("/", (req, res) => {
  res.send("Booking System Backend API is running...");
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));