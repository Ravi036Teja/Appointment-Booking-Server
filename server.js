const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/bookings", require("./routes/bookingRoute"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/blocked", require("./routes/blockedSlotRoute"))

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
