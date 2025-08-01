const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");


connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/bookings", require("./routes/bookingRoute"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/blocked", require("./routes/blockedSlotRoute"))
// New payment routes
// app.use("/api/payments", require("./routes/paymentRoutes")); 

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
