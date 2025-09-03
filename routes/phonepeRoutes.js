const express = require("express");
const { randomUUID } = require("crypto");
const rawBody = require("raw-body");
require("dotenv").config();


const {
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
  Env
} = require("pg-sdk-node");

const Booking = require("../models/Booking");

const router = express.Router();

const {
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  PHONEPE_CLIENT_VERSION,
  ENV,
  REDIRECT_URL,
  FRONTEND_URL,
} = process.env;

// Initialize PhonePe client
const client = StandardCheckoutClient.getInstance(
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  parseInt(PHONEPE_CLIENT_VERSION),
  ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
);

/**
 * 1️⃣ Create booking & initiate payment
 */
router.post("/pay", async (req, res) => {
  try {
    const { name, phone, date, timeSlot } = req.body;
    if (!name || !phone || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const merchantOrderId = randomUUID();

    const fixedAmount = 100; // ₹100 fixed appointment fee
    const amountInPaise = fixedAmount * 100; // 10000 paise

    // Create booking in DB with fixed price
    const booking = await Booking.create({
      name,
      phone,
      date,
      timeSlot,
      amount: fixedAmount, // store rupees in DB
      merchantOrderId,
      status: "Pending"
    });

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaise)
      .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
      .build();

    const response = await client.pay(payRequest);

    if (response?.redirectUrl) {
      res.json({
        redirectUrl: response.redirectUrl,
        merchantOrderId,
        bookingId: booking._id
      });
    } else {
      res.status(500).json({ error: "No redirect URL", response });
    }
  } catch (err) {
    console.error("[PAY] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2️⃣ Redirect Handler (user lands here after payment)
 */
router.get("/redirect-handler", async (req, res) => {
  try {
    const { merchantOrderId } = req.query;
    console.log("[REDIRECT] Query:", req.query);

    if (!merchantOrderId) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
    }

    const statusResp = await client.getOrderStatus(merchantOrderId);
    console.log("[REDIRECT] Status Response:", statusResp);

    const state = statusResp?.state?.toUpperCase();
    const txnId = statusResp?.transactionId || "NA";

    // Fetch booking details from DB
    const booking = await Booking.findOne({ merchantOrderId });
    if (!booking) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
    }

    // Update booking with transaction ID & status
    let bookingStatus = "Pending";
    if (state === "COMPLETED") bookingStatus = "Paid";
    else if (state === "FAILED") bookingStatus = "Failed";
    else if (state === "EXPIRED") bookingStatus = "Expired";

    booking.status = bookingStatus;
    booking.paymentDetails = booking.paymentDetails || {};
    booking.paymentDetails.phonepeTransactionId = txnId;
    await booking.save();

    if (bookingStatus === "Paid") {
      return res.redirect(
        `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`
      );
    } else if (bookingStatus === "Failed") {
      return res.redirect(
        `${FRONTEND_URL}/payment-result?status=failure&orderId=${merchantOrderId}`
      );
    }

    res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}`);
  } catch (err) {
    console.error("[REDIRECT] Error:", err);
    res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
  }
});

/**
 * 3️⃣ Webhook (server-to-server confirmation)
 */
router.post("/phonepe-callback", async (req, res) => {
  try {
    const buf = await rawBody(req);
    const signature = req.headers["authorization"];

    const callbackResp = client.validateCallback(
      PHONEPE_CLIENT_ID,
      PHONEPE_CLIENT_SECRET,
      signature,
      buf.toString()
    );

    const { payload } = callbackResp;
    const { merchantOrderId, state, transactionId } = payload;

    let bookingStatus = "Pending";
    if (state?.toUpperCase() === "COMPLETED") bookingStatus = "Paid";
    else if (state?.toUpperCase() === "FAILED") bookingStatus = "Failed";
    else if (state?.toUpperCase() === "EXPIRED") bookingStatus = "Expired";

    await Booking.findOneAndUpdate(
      { merchantOrderId },
      {
        status: bookingStatus,
        paymentDetails: {
          phonepeTransactionId: transactionId,
          rawCallback: payload
        }
      }
    );

    console.log(`[WEBHOOK] Booking ${merchantOrderId} updated to ${bookingStatus}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
});

module.exports = router;


// const express = require("express");
// const { randomUUID } = require("crypto");
// const rawBody = require("raw-body");
// require("dotenv").config();
// const User = require("../models/Users.Model");
// const { protect } = require("../middleware/authMiddleware");

// const {
//   StandardCheckoutClient,
//   StandardCheckoutPayRequest,
//   Env
// } = require("pg-sdk-node");

// const Booking = require("../models/Booking");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
//   // CALLBACK_URL, <-- This is not used in the code but is still needed in .env
// } = process.env;

// // Initialize PhonePe client
// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// //-----------------------------------------------------------------------------------------------------------------------------------------------------------------

// /**
//  * 1️⃣ Create booking & initiate payment
//  */
// router.post("/pay", protect, async (req, res) => {
//   try {
//     const { date, timeSlot } = req.body;
//     const userId = req.user._id;

//     if (!date || !timeSlot) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const fixedAmount = 100;
//     const amountInPaise = fixedAmount * 100;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Create booking in DB, linking it to the user
//     const booking = await Booking.create({
//       user: userId,
//       name: user.name,
//       phone: user.phone,
//       date,
//       timeSlot,
//       amount: fixedAmount,
//       merchantOrderId,
//       status: "Pending",
//     });

//     // We have removed the `.callbackUrl()` chain to avoid the TypeError.
//     // The webhook URL must be configured directly in your PhonePe dashboard.
//    const payRequest = StandardCheckoutPayRequest.builder()
//   .merchantOrderId(merchantOrderId)
//   .amount(amountInPaise)
//   .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//   .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       user.bookings.push(booking._id);
//       await user.save();

//       res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id
//       });
//     } else {
//       res.status(500).json({ error: "No redirect URL", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// //-----------------------------------------------------------------------------------------------------------------------------------------------------------------

// /**
//  * 2️⃣ Redirect Handler (user lands here after payment)
//  */
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     console.log("[REDIRECT] Query:", req.query);

//     if (!merchantOrderId) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     // The order status check is the fallback to the webhook.
//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     console.log("[REDIRECT] Status Response:", statusResp);

//     const state = statusResp?.state?.toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;

//     const updatedBooking = await booking.save();
    
//     if (bookingStatus === "Paid") {
//       const user = await User.findById(updatedBooking.user);
//       if (user && !user.bookings.includes(updatedBooking._id)) {
//         user.bookings.push(updatedBooking._id);
//         await user.save();
//       }
//     }

//     const user = await User.findById(updatedBooking.user);
//     if (!user) {
//         return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     if (bookingStatus === "Paid") {
//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=success&paymentId=${updatedBooking._id}&name=${encodeURIComponent(user.name)}&phone=${user.phone}&date=${encodeURIComponent(updatedBooking.date)}&time=${encodeURIComponent(updatedBooking.timeSlot)}`
//       );
//     } else if (bookingStatus === "Failed") {
//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=failure&orderId=${merchantOrderId}`
//       );
//     }

//     res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}`);
//   } catch (err) {
//     console.error("[REDIRECT] Error:", err);
//     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });

// //-----------------------------------------------------------------------------------------------------------------------------------------------------------------

// /**
//  * 3️⃣ Webhook (server-to-server confirmation)
//  */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     const buf = await rawBody(req);
//     const signature = req.headers["authorization"];

//     const callbackResp = client.validateCallback(
//       PHONEPE_CLIENT_ID,
//       PHONEPE_CLIENT_SECRET,
//       signature,
//       buf.toString()
//     );

//     const { payload } = callbackResp;
//     const { merchantOrderId, state, transactionId } = payload;
    
//     let bookingStatus = "Pending";
//     if (state?.toUpperCase() === "COMPLETED") bookingStatus = "Paid";
//     else if (state?.toUpperCase() === "FAILED") bookingStatus = "Failed";
//     else if (state?.toUpperCase() === "EXPIRED") bookingStatus = "Expired";

//     const updatedBooking = await Booking.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: bookingStatus,
//         paymentDetails: {
//           phonepeTransactionId: transactionId,
//           rawCallback: payload
//         },
//       },
//       { new: true }
//     );

//     if (updatedBooking && updatedBooking.status === 'Paid') {
//       const user = await User.findById(updatedBooking.user);
//       if (user && !user.bookings.includes(updatedBooking._id)) {
//         user.bookings.push(updatedBooking._id);
//         await user.save();
//         console.log(`[WEBHOOK] Booking ${merchantOrderId} linked to user.`);
//       }
//     }

//     console.log(`[WEBHOOK] Booking ${merchantOrderId} updated to ${bookingStatus}`);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("[WEBHOOK] Error:", err);
//     res.status(400).json({ error: "Invalid webhook" });
//   }
// });

// //-----------------------------------------------------------------------------------------------------------------------------------------------------------------
// /**
//  * 4️⃣ Get Booking Status by ID (for frontend display)
//  */
// router.get("/status/:bookingId", async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const booking = await Booking.findById(bookingId).populate('user');

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found." });
//     }

//     res.status(200).json({ success: true, booking: {
//       name: booking.name,
//       phone: booking.phone,
//       date: booking.date,
//       timeSlot: booking.timeSlot,
//       amount: booking.amount,
//       paymentId: booking._id,
//       // You can also add user email from the populated user object if available
//       email: booking.user.email // assuming your user model has an 'email' field
//     }});
//   } catch (err) {
//     console.error("[STATUS] Error:", err);
//     res.status(500).json({ success: false, message: "Internal server error." });
//   }
// });

// // Make sure you export this route

// module.exports = router;
