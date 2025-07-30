const express = require("express");
const router = express.Router();
const { bookSlot, getBookedSlots ,getAllBookings,} = require("../controllers/bookingController");

router.post("/book", bookSlot);
router.get("/booked/:date", getBookedSlots);
router.get("/", getAllBookings);

module.exports = router;
