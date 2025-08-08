// const dotenv = require("dotenv");
// dotenv.config();

// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db");
// const path = require('path'); // Import path module

// // Import your new auth route and middleware
// const authRoutes = require('./routes/authRoutes');
// const { protect } = require('./middleware/authMiddleware');

// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Serve static files from the 'uploads' directory
// // This makes http://localhost:5000/uploads/your-image.png accessible
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Auth Routes (Public)
// app.use("/api/auth", authRoutes); // This must come BEFORE protected routes

// app.use("/api/bookings", require("./routes/bookingRoute"));
// app.use("/api/admin", require("./routes/adminRoutes"));
// app.use("/api/blocked", require("./routes/blockedSlotRoute"))
// app.use('/api/gallery', require("./routes/ImageRoutes"));
// // New payment routes
// app.use("/api/payments", require("./routes/paymentRoutes")); 

// // ✅ Root route
// app.get("/", (req, res) => {
//   res.send("Backend API is running...");
// });

// // IMPORTANT: Define your JWT_SECRET in your .env file
// // Example: JWT_SECRET=your_super_secret_jwt_key_here

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
connectDB();

//  Require the cron job file to start the scheduler
require('./cron');

const app = express();
app.use(cors());
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
app.use('/api/payment', require("./routes/phonepeRoutes"));

// Root route
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));