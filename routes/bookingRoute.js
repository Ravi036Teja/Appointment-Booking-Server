// const express = require("express");
// const router = express.Router();
// const { bookSlot, getBookedSlots ,getAllBookings,} = require("../controllers/bookingController");

// router.post("/book", bookSlot);
// router.get("/booked/:date", getBookedSlots);
// router.get("/", getAllBookings);

// module.exports = router;

// backend/routes/bookingRoute.js

const express = require("express");
const router = express.Router();
const { bookSlot, getBookedSlots, getAllBookings } = require("../controllers/bookingController"); // Correct path to your bookingController

router.post("/book", bookSlot);
router.get("/booked/:date", getBookedSlots);
router.get("/", getAllBookings); // Assuming you want a route to get all bookings for admin

module.exports = router;

// after phonepe getway

// const express = require("express");
// const router = express.Router();
// const { getBookedSlots ,getAllBookings } = require("../controllers/bookingController"); // Removed bookSlot

// // router.post("/book", bookSlot); // <--- REMOVE THIS LINE
// router.get("/booked/:date", getBookedSlots);
// router.get("/", getAllBookings);

// module.exports = router;