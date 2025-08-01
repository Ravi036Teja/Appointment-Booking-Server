// const dayjs = require("dayjs");
// const Booking = require("../models/Booking");
// const sendWhatsAppMessage = require("../utils/whatsappSender");

// exports.getAllBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
//     res.status(200).json(bookings);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch bookings" });
//   }
// };

// exports.bookSlot = async (req, res) => {
//   const { date, timeSlot, name, phone} = req.body;

//   try {
//     // Prevent booking past time slots (including same day)
//     const now = dayjs();
//     const bookingDateTime = dayjs(`${date} ${timeSlot}`, "YYYY-MM-DD HH:mm");

//     if (bookingDateTime.isBefore(now)) {
//       return res.status(400).json({ message: "Cannot book a past time slot." });
//     }

//     // Save booking
//     const newBooking = new Booking({ date, timeSlot, name, phone});
//     await newBooking.save();

//     // Send WhatsApp confirmation
//     await sendWhatsAppMessage(phone, `🙏 Hi ${name}, your appointment is confirmed for ${date} at ${timeSlot}.`);

//     res.status(201).json({ success: true, message: "Booking confirmed" });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Slot already booked" });
//     }
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getBookedSlots = async (req, res) => {
//   const { date } = req.params;
//   try {
//     const bookings = await Booking.find({ date });
//     const slots = bookings.map((b) => b.timeSlot);
//     res.json(slots);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to get slots" });
//   }
// };

// backend/controllers/bookingController.js

const dayjs = require("dayjs");
const Booking = require("../models/Booking"); // Correct path to your Booking model
const sendWhatsAppMessage = require("../utils/whatsappSender"); // Ensure this path is correct

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching all bookings:", err); // Add logging
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

exports.bookSlot = async (req, res) => {
  const { date, timeSlot, name, phone } = req.body;

  try {
    // Input validation (basic)
    if (!date || !timeSlot || !name || !phone) {
      return res.status(400).json({ message: "Missing required booking information." });
    }
    if (!/^\d{10,}$/.test(phone)) { // More robust phone validation
        return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
    }
    if (!name.trim() || name.length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ message: "Please enter a valid name (letters and spaces only, min 2 chars)." });
    }

    // Prevent booking past time slots (including same day)
    const now = dayjs();
    const bookingDateTime = dayjs(`${date} ${timeSlot}`, "YYYY-MM-DD HH:mm");

    if (bookingDateTime.isBefore(now)) {
      return res.status(400).json({ message: "Cannot book a past time slot." });
    }

    // Check if the slot is already booked (using the unique index ensures this, but a prior check gives a cleaner error message)
    const existingBooking = await Booking.findOne({ date, timeSlot });
    if (existingBooking) {
        return res.status(409).json({ message: "This slot is already taken. Please choose another one." });
    }

    // Save booking
    const newBooking = new Booking({ date, timeSlot, name, phone });
    await newBooking.save();

    console.log("Booking saved successfully:", newBooking); // Log success

    // Send WhatsApp confirmation
    // Ensure sendWhatsAppMessage is robust or has a try-catch itself
    // We'll wrap it here just in case, so booking isn't failed by WhatsApp error
    try {
        await sendWhatsAppMessage(phone, `🙏 Hi ${name}, your appointment is confirmed for ${date} at ${timeSlot}.`);
        console.log("WhatsApp message sent successfully for booking:", newBooking._id);
    } catch (whatsappErr) {
        console.error("Failed to send WhatsApp message for booking:", newBooking._id, whatsappErr);
        // Do not return an error here if booking itself was successful,
        // unless you strictly require WhatsApp message to be sent for booking to be valid.
        // For now, we'll let the booking succeed even if WhatsApp fails.
    }


    res.status(201).json({ success: true, message: "Booking confirmed" });
  } catch (error) {
    console.error("Error during bookSlot:", error); // Log the actual error for debugging

    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ message: "Slot already booked by another user. Please choose a different time." });
    }
    if (error.name === 'ValidationError') {
        // Mongoose validation error (e.g., required fields missing from schema, type mismatch)
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: "Booking validation failed", errors: errors });
    }
    res.status(500).json({ message: "Server error during booking. Please try again later." });
  }
};

exports.getBookedSlots = async (req, res) => {
  const { date } = req.params;
  try {
    const bookings = await Booking.find({ date });
    const slots = bookings.map((b) => b.timeSlot);
    res.json(slots);
  } catch (error) {
    console.error("Error fetching booked slots:", error); // Add logging
    res.status(500).json({ message: "Failed to get slots" });
  }
};
// after phonepe gatway
// const dayjs = require("dayjs");
// const Booking = require("../models/Booking");
// const sendWhatsAppMessage = require("../utils/whatsappSender"); // Assuming this utility exists

// exports.getAllBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find().sort({ date: -1, timeSlot: -1 }); // latest first
//     res.status(200).json(bookings);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch bookings" });
//   }
// };

// // This function will now be called INTERNALLY by the payment callback, not directly from frontend.
// exports.createBookingRecord = async (bookingData) => {
//   const {
//     date,
//     timeSlot,
//     name,
//     phone,
//     email,
//     phonePeTransactionId,
//     merchantTransactionId,
//   } = bookingData;

//   try {
//     // Prevent booking past time slots (including same day) - Redundant check here, but good as a fallback
//     const now = dayjs();
//     const bookingDateTime = dayjs(`${date} ${timeSlot}`, "YYYY-MM-DD HH:mm");

//     if (bookingDateTime.isBefore(now)) {
//       console.warn(`Attempt to book past slot: ${date} ${timeSlot}`);
//       // Decide how to handle this, perhaps return an error or just log
//       return { success: false, message: "Cannot book a past time slot." };
//     }

//     // Check if a booking with this merchantTransactionId already exists
//     let existingBooking = await Booking.findOne({ merchantTransactionId });
//     if (existingBooking) {
//       if (existingBooking.paymentStatus === "SUCCESS") {
//         console.log(
//           `Booking with merchantTransactionId ${merchantTransactionId} already exists and is successful.`
//         );
//         return { success: true, message: "Booking already confirmed." };
//       } else {
//         // Handle cases where a PENDING booking exists but callback indicates success
//         existingBooking.paymentStatus = "SUCCESS";
//         existingBooking.phonePeTransactionId = phonePeTransactionId;
//         await existingBooking.save();
//         await sendWhatsAppMessage(
//           phone,
//           `🙏 Hi ${name}, your appointment is confirmed for ${date} at ${format12Hour(
//             timeSlot
//           )}. Thank you for your payment!`
//         );
//         return { success: true, message: "Booking updated to confirmed." };
//       }
//     }

//     // Save new booking with 'SUCCESS' status
//     const newBooking = new Booking({
//       date,
//       timeSlot,
//       name,
//       phone,
//       email,
//       paymentStatus: "SUCCESS",
//       phonePeTransactionId,
//       merchantTransactionId,
//     });
//     await newBooking.save();

//     // Send WhatsApp confirmation
//     const format12Hour = (timeStr) => {
//       // Define helper function here or import
//       const [hour, minute] = timeStr.split(":").map(Number);
//       const ampm = hour >= 12 ? "PM" : "AM";
//       const displayHour = hour % 12 === 0 ? 12 : hour % 12;
//       return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
//     };

//     try {
//       const templateName = "hello_world"; // Or your custom template, e.g., "appointment_booked"
//       const components = [
//         {
//           type: "body",
//           parameters: [
//             {
//               type: "text",
//               text: name, // Placeholder for {{1}} in 'hello_world'
//             },
//           ],
//         },
//       ];
//       // If using 'appointment_booked' template:
//       // const components = [
//       //     { type: "body", parameters: [{ type: "text", text: name }] }, // {{1}}
//       //     { type: "body", parameters: [{ type: "text", text: "Dental Checkup" }] }, // {{2}} - replace with actual service
//       //     { type: "body", parameters: [{ type: "text", text: date }] }, // {{3}}
//       //     { type: "body", parameters: [{ type: "text", text: timeSlot }] } // {{4}}
//       // ];

//       await sendWhatsappMessage(phone, templateName, components);
//       console.log("WhatsApp message scheduled for sending.");
//     } catch (whatsappError) {
//       console.error(
//         "Failed to send WhatsApp confirmation message:",
//         whatsappError.message
//       );
//       // IMPORTANT: Don't block the payment flow if WhatsApp fails.
//       // You might log this or have a retry mechanism.
//     }
//     // --- END WHATSAPP MESSAGE SENDING ---

//     return { success: true, message: "Booking confirmed" };
//   } catch (error) {
//     if (error.code === 11000) {
//       console.error("Duplicate slot booking attempt (DB unique index):", error);
//       return {
//         success: false,
//         message: "Slot already booked (duplicate entry).",
//       };
//     }
//     console.error("Server error during booking creation:", error);
//     return { success: false, message: "Server error during booking creation." };
//   }
// };

// exports.getBookedSlots = async (req, res) => {
//   const { date } = req.params;
//   try {
//     const bookings = await Booking.find({ date, paymentStatus: "SUCCESS" }); // Only consider SUCCESSFUL payments
//     const slots = bookings.map((b) => b.timeSlot);
//     res.json(slots);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to get slots" });
//   }
// };
