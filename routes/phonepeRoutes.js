// const express = require("express");
// const { randomUUID } = require("crypto");
// const rawBody = require("raw-body");
// require("dotenv").config();

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
// } = process.env;

// // Initialize PhonePe client
// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Create booking & initiate payment
//  */
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot } = req.body;
//     if (!name || !phone || !date || !timeSlot) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();

//     const fixedAmount = 100; // ₹100 fixed appointment fee
//     const amountInPaise = fixedAmount * 100; // 10000 paise

//     // Create booking in DB with fixed price
//     const booking = await Booking.create({
//       name,
//       phone,
//       date,
//       timeSlot,
//       amount: fixedAmount, // store rupees in DB
//       merchantOrderId,
//       status: "Pending"
//     });

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
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

//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     console.log("[REDIRECT] Status Response:", statusResp);

//     const state = statusResp?.state?.toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";

//     // Fetch booking details from DB
//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     // Update booking with transaction ID & status
//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     if (bookingStatus === "Paid") {
//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`
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

//     await Booking.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: bookingStatus,
//         paymentDetails: {
//           phonepeTransactionId: transactionId,
//           rawCallback: payload
//         }
//       }
//     );

//     console.log(`[WEBHOOK] Booking ${merchantOrderId} updated to ${bookingStatus}`);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("[WEBHOOK] Error:", err);
//     res.status(400).json({ error: "Invalid webhook" });
//   }
// });

// module.exports = router;

// whatasapp api

// const express = require("express");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const { StandardCheckoutClient, StandardCheckoutPayRequest, Env } = require("pg-sdk-node");
// const Booking = require("../models/Booking");
// const { sendWhatsAppConfirmation } = require("../services/msg91Services");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Create booking & initiate payment
//  */
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage } = req.body;
//     if (!name || !phone || !date || !timeSlot) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const fixedAmount = 100;
//     const amountInPaise = fixedAmount * 100;

//     const booking = await Booking.create({
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage, // Save language preference
//       amount: fixedAmount,
//       merchantOrderId,
//       status: "Pending",
//     });

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id,
//       });
//     } else {
//       res.status(500).json({ error: "No redirect URL", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler (user lands here after payment)
//  * This is where we will check status and send the message.
//  */
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     console.log("[REDIRECT] Query:", req.query);

//     if (!merchantOrderId) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

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

//     // Update booking with transaction ID & status
//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     if (bookingStatus === "Paid") {
//       // ✅ This is where you now send the WhatsApp message
//       console.log("[REDIRECT] Payment confirmed. Attempting to send WhatsApp message.");
//       await sendWhatsAppConfirmation(
//         booking.name,
//         booking.phone,
//         booking.date,
//         booking.timeSlot,
//         booking.userLanguage // Pass the stored language
//       );

//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`
//       );
//     } else {
//       console.log(`[REDIRECT] Payment state is not 'COMPLETED'. Not sending WhatsApp message. State: ${bookingStatus}`);
//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`
//       );
//     }
//   } catch (err) {
//     console.error("[REDIRECT] Error:", err);
//     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });

// module.exports = router;

// 2nd working code above code without admin notification

// ---- THIS BELOW CODE IS THE ONE THAT PERFECT -------------

// const express = require("express");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const { StandardCheckoutClient, StandardCheckoutPayRequest, Env } = require("pg-sdk-node");
// const Booking = require("../models/Booking");
// const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Create booking & initiate payment
//  */
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage } = req.body;
//     if (!name || !phone || !date || !timeSlot) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const fixedAmount = 100;
//     const amountInPaise = fixedAmount * 100;

//     const booking = await Booking.create({
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage, // Save language preference
//       amount: fixedAmount,
//       merchantOrderId,
//       status: "Pending",
//     });

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id,
//       });
//     } else {
//       res.status(500).json({ error: "No redirect URL", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler (user lands here after payment)
//  * This is where we will check status and send the message.
//  */
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     console.log("[REDIRECT] Query:", req.query);

//     if (!merchantOrderId) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     console.log("[REDIRECT] Status Response:", statusResp);

//     const state = statusResp?.state?.toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     // Update booking with transaction ID & status
//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     if (bookingStatus === "Paid") {
//       console.log("[REDIRECT] Payment confirmed. Attempting to send WhatsApp message.");

//       // Send confirmation to the customer
//       await sendWhatsAppConfirmation(
//         booking.name,
//         booking.phone,
//         booking.date,
//         booking.timeSlot,
//         booking.userLanguage
//       );

//       // Send notification to the admin
//       await sendAdminNotification(
//         booking.name,
//         booking.phone,
//         booking.date,
//         booking.timeSlot,
//         booking.amount
//       );

//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`
//       );
//     } else {
//       console.log(`[REDIRECT] Payment state is not 'COMPLETED'. Not sending WhatsApp message. State: ${bookingStatus}`);
//       return res.redirect(
//         `${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`
//       );
//     }
//   } catch (err) {
//     console.error("[REDIRECT] Error:", err);
//     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });

// module.exports = router;


//PRODUCTION ISSUE SOLUTION CODE-----------------------------------
// const express = require("express");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const {
//   StandardCheckoutClient,
//   StandardCheckoutPayRequest,
//   Env,
// } = require("pg-sdk-node");
// const Booking = require("../models/Booking");
// const {
//   sendWhatsAppConfirmation,
//   sendAdminNotification,
// } = require("../services/msg91Services");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// // Refund Helper with retry (treat PENDING as success)
// async function refundPayment(booking) {
//   const MAX_RETRIES = 2;
//   let attempt = 0;

//   async function attemptRefund() {
//     attempt++;
//     try {
//       const merchantRefundId = `refund_${Date.now()}`;
//       const refundRequest = {
//         originalMerchantOrderId: booking.merchantOrderId,
//         merchantRefundId,
//         amount: booking.amount * 100,
//         callbackUrl: `${REDIRECT_URL}/refund-callback`,
//       };
//       const response = await client.refund(refundRequest);
//       const state = response?.state?.toUpperCase();

//       booking.refundDetails = {
//         merchantRefundId,
//         refundTransactionId: response?.refundId || null,
//         amount: booking.amount,
//         response,
//         createdAt: booking.refundDetails?.createdAt || new Date(),
//         updatedAt: new Date(),
//       };

//       if (state === "PENDING" || state === "COMPLETED" || state === "SUCCESS") {
//         booking.refundStatus = "Refund Initiated";
//         await booking.save();
//         return true;
//       }

//       throw new Error(`Refund API returned failure state: ${state}`);
//     } catch (err) {
//       if (attempt < MAX_RETRIES) {
//         await new Promise((r) => setTimeout(r, 3000 * attempt));
//         return attemptRefund();
//       }
//       booking.refundStatus = "Refund Failed";
//       booking.refundDetails = {
//         ...(booking.refundDetails || {}),
//         updatedAt: new Date(),
//         response: { error: err.message },
//       };
//       await booking.save();
//       return false;
//     }
//   }

//   return attemptRefund();
// }

// // 1️⃣ Create booking & initiate payment
// // routes/phonepe.js
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage } = req.body;

//     // Validate input
//     if (!name || !phone || !date || !timeSlot) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const amount = 100; // Fixed appointment fee
//     const amountInPaise = amount * 100;

//     // Atomically create booking only if slot not Paid or Pending
//     const booking = await Booking.findOneAndUpdate(
//       {
//         date,
//         timeSlot,
//         status: { $nin: ["Paid", "Pending"] },
//       },
//       {
//         name,
//         phone,
//         date,
//         timeSlot,
//         userLanguage,
//         amount,
//         merchantOrderId,
//         status: "Pending",
//       },
//       { new: true, upsert: true, setDefaultsOnInsert: true }
//     );

//     if (!booking) {
//       return res.status(409).json({
//         error:
//           "This slot is already booked or in payment process. Please choose another slot.",
//       });
//     }

//     // Prepare PhonePe payment request
//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       // Send redirect URL to frontend
//       return res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id,
//       });
//     } else {
//       console.error("[PAY] No redirect URL received:", response);
//       return res.status(500).json({ error: "Failed to get payment link from PhonePe" });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     return res.status(500).json({ error: err.message || "Internal server error" });
//   }
// });


// // 2️⃣ Redirect Handler
// // routes/phonepe.js (only /redirect-handler part rewritten)
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     if (!merchantOrderId) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     // Get latest order status from PhonePe
//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     console.log("[REDIRECT] Order Status:", statusResp);

//     const state = (statusResp?.state || "").toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     // Determine booking status
//     let bookingStatus = "Pending";
//     if (["COMPLETED", "SUCCESS", "PAID", "CAPTURED", "SUCCESSFUL"].includes(state)) {
//       bookingStatus = "Paid";
//     } else if (state === "FAILED") {
//       bookingStatus = "Failed";
//     } else if (state === "EXPIRED") {
//       bookingStatus = "Expired";
//     }

//     // Update booking in DB
//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     // If payment is Paid, check double booking and send notifications
//     if (bookingStatus === "Paid") {
//       const slotTaken = await Booking.findOne({
//         date: booking.date,
//         timeSlot: booking.timeSlot,
//         status: "Paid",
//         _id: { $ne: booking._id },
//       });

//       if (slotTaken) {
//         booking.status = "Cancelled";
//         await booking.save();
//         await refundPayment(booking);

//         const refundParams = new URLSearchParams({
//           status: "refunded",
//           orderId: merchantOrderId,
//         });

//         return res.redirect(`${FRONTEND_URL}/payment-result?${refundParams.toString()}`);
//       }

//       // Send confirmations
//       await sendWhatsAppConfirmation(
//         booking.name,
//         booking.phone,
//         booking.date,
//         booking.timeSlot,
//         booking.userLanguage
//       );
//       await sendAdminNotification(
//         booking.name,
//         booking.phone,
//         booking.date,
//         booking.timeSlot,
//         booking.amount
//       );
//     }

//     // Build frontend redirect URL with all details
//     const params = new URLSearchParams({
//       status: bookingStatus.toLowerCase(),
//       txnId: txnId,
//       orderId: merchantOrderId,
//       name: booking.name,
//       phone: booking.phone,
//       date: booking.date,
//       time: booking.timeSlot,
//       amount: booking.amount,
//     });

//     return res.redirect(`${FRONTEND_URL}/payment-result?${params.toString()}`);
//   } catch (err) {
//     console.error("[REDIRECT] Error:", err);
//     return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });


// module.exports = router;



// // this is for app and website
// const express = require("express");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const {
//   StandardCheckoutClient,
//   StandardCheckoutPayRequest,
//   Env,
// } = require("pg-sdk-node");
// const Booking = require("../models/Booking");
// // const {
// //   sendWhatsAppConfirmation,
// //   sendAdminNotification,
// // } = require("../services/msg91Services");
// const { auth } = require("../middleware/authMiddleware");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Create booking & initiate payment
//  * This route is now used by both app and website.
//  * The 'auth' middleware will check for a token but won't stop guest users.
//  */
// // router.post("/pay", auth, async (req, res) => {
// //   try {
// //     const { name, phone, date, timeSlot, userLanguage, redirectUrl } = req.body;

// //     if (!name || !phone || !date || !timeSlot || !redirectUrl) {
// //       return res.status(400).json({ error: "Missing required fields" });
// //     }

// //     const merchantOrderId = randomUUID();
// //     const fixedAmount = 100;
// //     const amountInPaise = fixedAmount * 100;

// //     const bookingData = {
// //       name,
// //       phone,
// //       date,
// //       timeSlot,
// //       userLanguage,
// //       amount: fixedAmount,
// //       merchantOrderId,
// //       status: "Pending",
// //     };

// //     if (req.user) {
// //       bookingData.user = req.user._id;
// //     }

// //     const booking = await Booking.create(bookingData);

// //     const payRequest = StandardCheckoutPayRequest.builder()
// //       .merchantOrderId(merchantOrderId)
// //       .amount(amountInPaise)
// //       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
// //       .build();

// //     const response = await client.pay(payRequest);

// //     if (response?.redirectUrl) {
// //       res.json({
// //         redirectUrl: response.redirectUrl,
// //         merchantOrderId,
// //         bookingId: booking._id,
// //       });
// //     } else {
// //       res.status(500).json({ error: "No redirect URL", response });
// //     }
// //   } catch (err) {
// //     console.error("[PAY] Error:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// router.post("/pay", auth, async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage, redirectUrl } = req.body;

//     if (!name || !phone || !date || !timeSlot || !redirectUrl) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const fixedAmount = 100;
//     const amountInPaise = fixedAmount * 100;

//     const bookingData = {
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage,
//       amount: fixedAmount,
//       merchantOrderId,
//       status: "Pending",
//       // ✅ Store the dynamic URL provided by the client
//       redirectUrl,
//     };

//     if (req.user) {
//       bookingData.user = req.user._id;
//     }

//     const booking = await Booking.create(bookingData);

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       // ✅ Use your fixed server redirect URL for PhonePe callback
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id,
//       });
//     } else {
//       res.status(500).json({ error: "No redirect URL", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler (user lands here after payment)
//  * This is where we will check status and send the message.
//  */
// // router.get("/redirect-handler", async (req, res) => {
// //   try {
// //     const { merchantOrderId } = req.query;
// //     console.log("[REDIRECT] Received query:", req.query);

// //     if (!merchantOrderId) {
// //       console.log("[REDIRECT] ERROR: merchantOrderId not found in query.");
// //       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
// //     }

// //     // ⚠️ Enhanced logging for debugging
// //     console.log(`[REDIRECT] Checking status for Order ID: ${merchantOrderId}`);

// //     const statusResp = await client.getOrderStatus(merchantOrderId);
// //     console.log("[REDIRECT] PhonePe Status Response:", statusResp);

// //     const state = statusResp?.state?.toUpperCase();
// //     const txnId = statusResp?.transactionId || "NA";

// //     // ⚠️ Log the state returned by PhonePe
// //     console.log(`[REDIRECT] PhonePe State: ${state}`);

// //     const booking = await Booking.findOne({ merchantOrderId });
// //     if (!booking) {
// //       console.log(`[REDIRECT] ERROR: Booking not found for Order ID: ${merchantOrderId}`);
// //       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
// //     }

// //     let bookingStatus = "Pending";
// //     if (state === "COMPLETED") bookingStatus = "Paid";
// //     else if (state === "FAILED") bookingStatus = "Failed";
// //     else if (state === "EXPIRED") bookingStatus = "Expired";

// //     // Update booking with transaction ID & status
// //     booking.status = bookingStatus;
// //     booking.paymentDetails = booking.paymentDetails || {};
// //     booking.paymentDetails.phonepeTransactionId = txnId;
// //     await booking.save();

// //     // ⚠️ Log the final booking status before redirecting
// //     console.log(`[REDIRECT] Booking status updated to: ${bookingStatus}`);

// //     if (bookingStatus === "Paid") {
// //       console.log(
// //         "[REDIRECT] Payment confirmed. Attempting to send WhatsApp message."
// //       );
// //       // await sendWhatsAppConfirmation(...)
// //       return res.redirect(
// //         `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${
// //           booking.amount
// //         }&name=${encodeURIComponent(booking.name)}&phone=${
// //           booking.phone
// //         }&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(
// //           booking.timeSlot
// //         )}`
// //       );
// //     } else {
// //       console.log(
// //         `[REDIRECT] Payment state is not 'COMPLETED'. Redirecting with status: ${bookingStatus}`
// //       );
// //       return res.redirect(
// //         `${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`
// //       );
// //     }
// //   } catch (err) {
// //     console.error("[REDIRECT] An error occurred:", err);
// //     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
// //   }
// // });

// // payments.js - Corrected /redirect-handler route

// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     if (!merchantOrderId) {
//       // ❌ Redirect to a default failure page if ID is missing
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     const state = statusResp?.state?.toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";
    
//     // Determine booking status
//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     // Update the booking in the database
//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     // ✅ Use the dynamically stored URL from the booking
//     const finalRedirectUrl = booking.redirectUrl;

//     if (bookingStatus === "Paid") {
//       return res.redirect(
//         `${finalRedirectUrl}?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${
//           booking.amount
//         }&name=${encodeURIComponent(booking.name)}&phone=${
//           booking.phone
//         }&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(
//           booking.timeSlot
//         )}`
//       );
//     } else {
//       return res.redirect(
//         `${finalRedirectUrl}?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`
//       );
//     }
//   } catch (err) {
//     console.error("[REDIRECT] An error occurred:", err);
//     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });

// router.get("/check-status", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;

//     if (!merchantOrderId) {
//       return res
//         .status(400)
//         .json({ status: "failure", error: "Missing merchantOrderId" });
//     }

//     const booking = await Booking.findOne({ merchantOrderId });

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ status: "failure", error: "Booking not found" });
//     }

//     return res.json({ status: booking.status, booking });
//   } catch (err) {
//     console.error("[CHECK-STATUS] Error:", err);
//     res.status(500).json({ status: "failure", error: err.message });
//   }
// });

// module.exports = router;


// const express = require("express");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const {
//   StandardCheckoutClient,
//   StandardCheckoutPayRequest,
//   Env,
// } = require("pg-sdk-node");
// const Booking = require("../models/Booking");
// // const {
// //   sendWhatsAppConfirmation,
// //   sendAdminNotification,
// // } = require("../services/msg91Services");
// const { auth } = require("../middleware/authMiddleware");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Create booking & initiate payment
//  * This route is now used by both app and website.
//  */
// router.post("/pay", auth, async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage, redirectUrl } = req.body;

//     if (!name || !phone || !date || !timeSlot || !redirectUrl) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const merchantOrderId = randomUUID();
//     const fixedAmount = 100;
//     const amountInPaise = fixedAmount * 100;

//     const bookingData = {
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage,
//       amount: fixedAmount,
//       merchantOrderId,
//       status: "Pending",
//       redirectUrl, // ✅ Store the dynamic URL provided by the client
//     };

//     if (req.user) {
//       bookingData.user = req.user._id;
//     }

//     const booking = await Booking.create(bookingData);

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       // ✅ Use your fixed server redirect URL for PhonePe callback
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       res.json({
//         redirectUrl: response.redirectUrl,
//         merchantOrderId,
//         bookingId: booking._id,
//       });
//     } else {
//       res.status(500).json({ error: "No redirect URL", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler (user lands here after payment)
//  * This is where we will check status and redirect the user back to the correct app or website.
//  */
// // payments.js - Corrected /redirect-handler route

// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     if (!merchantOrderId) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const statusResp = await client.getOrderStatus(merchantOrderId);
//     const state = statusResp?.state?.toUpperCase();
//     const txnId = statusResp?.transactionId || "NA";
    
//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     // ✅ Sanitize the redirectUrl to prevent extra slashes
//     let finalRedirectUrl = booking.redirectUrl;
//     // This regex ensures there are only two slashes after the scheme
//     finalRedirectUrl = finalRedirectUrl.replace(/^(.*:)\/{2,}/, '$1//');

//     // 💡 Example: if it was 'appointment-app:///payment-result', it becomes 'appointment-app://payment-result'

//     if (bookingStatus === "Paid") {
//       return res.redirect(
//         `${finalRedirectUrl}?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${
//           booking.amount
//         }&name=${encodeURIComponent(booking.name)}&phone=${
//           booking.phone
//         }&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(
//           booking.timeSlot
//         )}`
//       );
//     } else {
//       return res.redirect(
//         `${finalRedirectUrl}?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`
//       );
//     }
//   } catch (err) {
//     console.error("[REDIRECT] An error occurred:", err);
//     res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });


// router.get("/check-status", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;

//     if (!merchantOrderId) {
//       return res
//         .status(400)
//         .json({ status: "failure", error: "Missing merchantOrderId" });
//     }

//     const booking = await Booking.findOne({ merchantOrderId });

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ status: "failure", error: "Booking not found" });
//     }

//     return res.json({ status: booking.status, booking });
//   } catch (err) {
//     console.error("[CHECK-STATUS] Error:", err);
//     res.status(500).json({ status: "failure", error: err.message });
//   }
// });

// module.exports = router;
// routes/phonepe.js




// const express = require("express");
// const { StandardCheckoutClient, StandardCheckoutPayRequest, Env } = require("pg-sdk-node");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const Booking = require("../models/Booking");
// const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// /**
//  * 1️⃣ Initiate payment
//  */
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, userLanguage } = req.body;
//     if (!name || !phone || !date || !timeSlot) return res.status(400).json({ error: "Missing fields" });

//     const merchantOrderId = randomUUID();
//     const amountInPaise = 100 * 100; // ₹100

//     const booking = await Booking.create({
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage,
//       amount: 100,
//       merchantOrderId,
//       status: "Pending",
//     });

//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       return res.json({ redirectUrl: response.redirectUrl, merchantOrderId, bookingId: booking._id });
//     } else {
//       return res.status(500).json({ error: "No redirect URL from PhonePe", response });
//     }
//   } catch (err) {
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler
//  */
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.query;
//     if (!merchantOrderId) return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);

//     const booking = await Booking.findOne({ merchantOrderId });
//     if (!booking) return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);

//     // Fetch order status from PhonePe
//     const statusResp = await client.getOrderStatus(merchantOrderId);

//     // Extract state & txnId safely
//     let state = "PENDING";
//     let txnId = "NA";

//     if (statusResp) {
//       if (statusResp.state) state = statusResp.state.toUpperCase();
//       // Try multiple possible locations for transactionId
//       if (statusResp.transactionId) txnId = statusResp.transactionId;
//       else if (statusResp.data?.transactionId) txnId = statusResp.data.transactionId;
//       else if (statusResp.order?.transactionId) txnId = statusResp.order.transactionId;
//     }

//     // Map PhonePe states to booking status
//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED") bookingStatus = "Failed";
//     else if (state === "EXPIRED") bookingStatus = "Expired";

//     booking.status = bookingStatus;
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;
//     await booking.save();

//     // Always redirect success if booking.status === "Paid"
//     if (bookingStatus === "Paid") {
//       try {
//         await sendWhatsAppConfirmation(
//           booking.name,
//           booking.phone,
//           booking.date,
//           booking.timeSlot,
//           booking.userLanguage
//         );

//         await sendAdminNotification(
//           booking.name,
//           booking.phone,
//           booking.date,
//           booking.timeSlot,
//           booking.amount
//         );
//       } catch (msgErr) {
//         console.error("[REDIRECT] WhatsApp/Notification Error:", msgErr);
//       }

//       const url = `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
//       return res.redirect(url);
//     } else {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
//     }
//   } catch (err) {
//     console.error("[REDIRECT] Error:", err);
//     return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });

// module.exports = router;



// const express = require("express");
// const mongoose = require("mongoose");
// const { StandardCheckoutClient, StandardCheckoutPayRequest, StandardCheckoutRefundRequest , Env } = require("pg-sdk-node");
// const { randomUUID } = require("crypto");
// require("dotenv").config();
// const Booking = require("../models/Booking");
// const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");

// const router = express.Router();

// const {
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   PHONEPE_CLIENT_VERSION,
//   ENV,
//   REDIRECT_URL,
//   FRONTEND_URL,
// } = process.env;

// const client = StandardCheckoutClient.getInstance(
//   PHONEPE_CLIENT_ID,
//   PHONEPE_CLIENT_SECRET,
//   parseInt(PHONEPE_CLIENT_VERSION),
//   ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
// );

// router.post("/pay", async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { name, phone, date, timeSlot, userLanguage } = req.body;
//     if (!name || !phone || !date || !timeSlot) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     // Check if the slot is already booked or held
//     const existingBooking = await Booking.findOne({ date, timeSlot, status: { $in: ["Pending", "Paid"] } }).session(session);

//     if (existingBooking) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(409).json({ error: "This slot is already booked or is being processed." });
//     }

//     // Create a new booking and immediately "hold" the slot within the transaction
//     const merchantOrderId = randomUUID();
//     const amountInPaise = 100 * 100; // ₹100

//     const booking = await Booking.create([{
//       name,
//       phone,
//       date,
//       timeSlot,
//       userLanguage,
//       amount: 100,
//       merchantOrderId,
//       status: "Pending",
//       isHeld: true // Mark the slot as held
//     }], { session });

//     // Initiate payment with PhonePe
//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amountInPaise)
//       .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//       .build();

//     const response = await client.pay(payRequest);

//     if (response?.redirectUrl) {
//       await session.commitTransaction();
//       session.endSession();
//       return res.json({ redirectUrl: response.redirectUrl, merchantOrderId, bookingId: booking[0]._id });
//     } else {
//       await session.abortTransaction();
//       session.endSession();
//       // Handle failed payment initiation
//       return res.status(500).json({ error: "No redirect URL from PhonePe", response });
//     }
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("[PAY] Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 2️⃣ Redirect Handler
//  */
// router.get("/redirect-handler", async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { merchantOrderId } = req.query;
//     if (!merchantOrderId) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     // Find the booking within the transaction
//     const booking = await Booking.findOne({ merchantOrderId }).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }

//     const statusResp = await client.getOrderStatus(merchantOrderId);

//     let state = "PENDING";
//     let txnId = "NA";
//     if (statusResp) {
//       if (statusResp.state) state = statusResp.state.toUpperCase();
//       if (statusResp.transactionId) txnId = statusResp.transactionId;
//       else if (statusResp.data?.transactionId) txnId = statusResp.data.transactionId;
//       else if (statusResp.order?.transactionId) txnId = statusResp.order.transactionId;
//     }

//     let bookingStatus = "Pending";
//     if (state === "COMPLETED") bookingStatus = "Paid";
//     else if (state === "FAILED" || state === "EXPIRED") bookingStatus = "Failed";

//     // Update booking status and details
//     booking.status = bookingStatus;
//     booking.isHeld = false; // Release the hold
//     booking.paymentDetails = booking.paymentDetails || {};
//     booking.paymentDetails.phonepeTransactionId = txnId;

//     await booking.save({ session });
//     await session.commitTransaction();
//     session.endSession();

//     if (bookingStatus === "Paid") {
//       try {
//         await sendWhatsAppConfirmation(booking.name, booking.phone, booking.date, booking.timeSlot, booking.userLanguage);
//         await sendAdminNotification(booking.name, booking.phone, booking.date, booking.timeSlot, booking.amount);
//       } catch (msgErr) {
//         console.error("[REDIRECT] WhatsApp/Notification Error:", msgErr);
//       }
//       const url = `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
//       return res.redirect(url);
//     } else {
//       return res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
//     }
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("[REDIRECT] Error:", err);
//     return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//   }
// });


// // payments.js
// /**
//  * 3️⃣ Refund a payment from the Admin Panel
//  */
// router.post("/refund", async (req, res) => {
//   const { merchantOrderId } = req.body;
  
//   if (!merchantOrderId) {
//     return res.status(400).json({ error: "Missing merchantOrderId" });
//   }

//   try {
//     const booking = await Booking.findOne({ merchantOrderId });

//     if (!booking) {
//       return res.status(404).json({ error: "Booking not found" });
//     }

//     if (booking.status !== "Paid" || booking.refundStatus !== "Not Refunded") {
//       return res.status(400).json({ error: "Cannot refund a non-paid or already-refunded booking." });
//     }

//     const refundRequest = StandardCheckoutRefundRequest.builder()
//       .merchantRefundId(randomUUID()) // A new unique ID for the refund
//       .originalMerchantOrderId(merchantOrderId)
//       .amount(booking.amount * 100) // Amount in paise
//       .build();

//     const refundResponse = await client.refund(refundRequest);

//     if (refundResponse.success) {
//       booking.refundStatus = "Refund Initiated";
//       booking.status = "Cancelled";
//       booking.refundDetails = {
//         merchantRefundId: refundRequest.merchantRefundId,
//         refundTransactionId: refundResponse.data?.refundTransactionId || "NA",
//         amount: booking.amount,
//         response: refundResponse,
//       };
//       await booking.save();

//       return res.json({ message: "Refund initiated successfully." });
//     } else {
//       console.error("PhonePe Refund API Error:", refundResponse);
//       return res.status(500).json({ error: "Failed to initiate refund with PhonePe." });
//     }
//   } catch (err) {
//     console.error("[REFUND] Error:", err);
//     res.status(500).json({ error: "An unexpected error occurred." });
//   }
// });


// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");
const pgSdk = require("pg-sdk-node"); // ✅ This is the correct way to import the module
const { randomUUID } = require("crypto");
const crypto = require("crypto");
require("dotenv").config();
const Booking = require("../models/Booking");
const axios = require("axios");
const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");

const router = express.Router();

const {
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    PHONEPE_CLIENT_VERSION,
    ENV,
    REDIRECT_URL,
    FRONTEND_URL,
} = process.env;

// ❌ OLD WAY: const { StandardCheckoutClient, StandardCheckoutPayRequest, StandardCheckoutRefundRequest, Env } = pgSdk;

// ✅ NEW WAY: Access classes directly from the pgSdk object
const client = pgSdk.StandardCheckoutClient.getInstance(
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    parseInt(PHONEPE_CLIENT_VERSION),
    ENV === "PROD" ? pgSdk.Env.PRODUCTION : pgSdk.Env.SANDBOX
);

/**
 * 1️⃣ Initiate Payment
 */
router.post("/pay", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, phone, date, timeSlot, userLanguage } = req.body;
        if (!name || !phone || !date || !timeSlot) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Missing fields" });
        }

        const existingBooking = await Booking.findOne({ date, timeSlot, status: { $in: ["Pending", "Paid"] } }).session(session);

        if (existingBooking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ error: "This slot is already booked or is being processed." });
        }

        const merchantOrderId = randomUUID();
        const amountInPaise = 1 * 100;

        const booking = await Booking.create([{
            name,
            phone,
            date,
            timeSlot,
            userLanguage,
            amount: 100,
            merchantOrderId,
            status: "Pending",
            isHeld: true
        }], { session });

        // ✅ Access StandardCheckoutPayRequest directly from pgSdk
        const payRequest = pgSdk.StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
            .build();

        const response = await client.pay(payRequest);

        if (response?.redirectUrl) {
            await session.commitTransaction();
            session.endSession();
            return res.json({ redirectUrl: response.redirectUrl, merchantOrderId, bookingId: booking[0]._id });
        } else {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ error: "No redirect URL from PhonePe", response });
        }
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[PAY] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * 2️⃣ Redirect Handler
 */
router.get("/redirect-handler", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { merchantOrderId } = req.query;
        if (!merchantOrderId) {
            await session.abortTransaction();
            session.endSession();
            return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
        }

        const booking = await Booking.findOne({ merchantOrderId }).session(session);

        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
        }

        const statusResp = await client.getOrderStatus(merchantOrderId);

        let state = "PENDING";
        let txnId = "NA";
        if (statusResp) {
            if (statusResp.state) state = statusResp.state.toUpperCase();
            if (statusResp.transactionId) txnId = statusResp.transactionId;
            else if (statusResp.data?.transactionId) txnId = statusResp.data.transactionId;
            else if (statusResp.order?.transactionId) txnId = statusResp.order.transactionId;
        }

        let bookingStatus = "Pending";
        let refundStatus = "Not Refunded";
        if (state === "COMPLETED") bookingStatus = "Paid";
        else if (state === "FAILED" || state === "EXPIRED") bookingStatus = "Failed";

        booking.status = bookingStatus;
        booking.isHeld = false;
        booking.refundStatus = refundStatus;
        booking.paymentDetails = booking.paymentDetails || {};
        booking.paymentDetails.phonepeTransactionId = txnId;

        await booking.save({ session });
        await session.commitTransaction();
        session.endSession();

        if (bookingStatus === "Paid") {
            try {
                await sendWhatsAppConfirmation(booking.name, booking.phone, booking.date, booking.timeSlot, booking.userLanguage);
                await sendAdminNotification(booking.name, booking.phone, booking.date, booking.timeSlot, booking.amount);
            } catch (msgErr) {
                console.error("[REDIRECT] WhatsApp/Notification Error:", msgErr);
            }
            const url = `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
            return res.redirect(url);
        } else {
            return res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
        }
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[REDIRECT] Error:", err);
        return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
    }
});


/**
 * 3️⃣ Refund a payment from the Admin Panel
 */
router.post("/refund", async (req, res) => {
    const { merchantOrderId } = req.body;
    
    if (!merchantOrderId) {
        return res.status(400).json({ error: "Missing merchantOrderId" });
    }

    try {
        const booking = await Booking.findOne({ merchantOrderId });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.status !== "Paid" || booking.refundStatus !== "Not Refunded") {
            return res.status(400).json({ error: "Cannot refund a non-paid or already-refunded booking." });
        }

        const merchantRefundId = crypto.randomUUID();
        const amountInPaise = booking.amount * 100;
        const phonepeClientId = process.env.PHONEPE_CLIENT_ID;
        const phonepeClientSecret = process.env.PHONEPE_CLIENT_SECRET;
        const saltIndex = "1"; // PhonePe V2 API requires the salt index in the checksum

        // 1. Construct the refund request object
        const refundRequest = {
            merchantId: phonepeClientId,
            merchantRefundId: merchantRefundId,
            originalMerchantOrderId: merchantOrderId,
            amount: amountInPaise,
        };

        // 2. Convert the request object to a Base64 encoded string
        const payloadString = JSON.stringify(refundRequest);
        const payloadBase64 = Buffer.from(payloadString).toString('base64');

       // 3. Construct the checksum string
// 3. Construct the checksum string
const checksumPath = process.env.ENV === 'PROD'
    ? "/pg/v2/refund"
    : "/apis/pg-sandbox/v2/refund"; // Correct path for UAT/Sandbox

const xVerifyString = payloadBase64 + checksumPath + phonepeClientSecret;
const checksum = crypto.createHash('sha256').update(xVerifyString).digest('hex') + "###" + saltIndex;

// 4. Set up the API call
const apiUrl = process.env.ENV === 'PROD'
    ? 'https://api.phonepe.com/apis/pg/v2/refund' // Production
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v2/refund'; // UAT/Sandbox
        console.log("Making API call to:", apiUrl);
        console.log("Payload:", refundRequest);
        console.log("Checksum String:", xVerifyString);
        console.log("Generated Checksum:", checksum);

        const apiResponse = await axios.post(
            apiUrl, 
            { request: payloadBase64 }, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                },
            }
        );

        if (apiResponse.data?.success) {
            booking.refundStatus = "Refund Initiated";
            booking.status = "Cancelled";
            booking.refundDetails = {
                merchantRefundId: merchantRefundId,
                response: apiResponse.data,
            };
            await booking.save();
            return res.json({ message: "Refund initiated successfully." });
        } else {
            console.error("PhonePe Refund API Error:", apiResponse.data);
            booking.refundStatus = "Refund Failed";
            await booking.save();
            return res.status(500).json({ error: "Failed to initiate refund with PhonePe." });
        }
    } catch (err) {
        console.error("[REFUND] Error:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});




/**
 * 4️⃣ PhonePe Refund Webhook Handler
 */
router.post("/refund-callback", async (req, res) => {
    const { body } = req;
    
    // 💡 Security Check: Verify the signature
    // You should use the same logic here as in the main payment callback to ensure the request is from PhonePe.
    // The details for signature verification will be in your PhonePe SDK or documentation.
    
    if (!body || !body.data || !body.data.merchantRefundId || !body.data.state) {
        console.error("[REFUND WEBHOOK] Invalid payload received.");
        return res.status(400).json({ status: "Failure", message: "Invalid payload." });
    }

    const { merchantRefundId, state } = body.data;
    const originalMerchantOrderId = body.data.merchantOrderId;

    try {
        const booking = await Booking.findOne({ merchantOrderId: originalMerchantOrderId });

        if (!booking) {
            console.error(`[REFUND WEBHOOK] Booking with merchantOrderId ${originalMerchantOrderId} not found.`);
            return res.status(404).json({ status: "Failure", message: "Booking not found." });
        }

        let newRefundStatus = "Pending";
        let newBookingStatus = booking.status;

        switch (state) {
            case "COMPLETED":
                newRefundStatus = "Refunded";
                newBookingStatus = "Cancelled"; // Change the booking status to cancelled after a successful refund
                console.log(`[REFUND WEBHOOK] Refund for OrderId ${originalMerchantOrderId} completed.`);
                break;
            case "FAILED":
                newRefundStatus = "Refund Failed";
                newBookingStatus = "Refund Failed"; // A new status to indicate refund failed
                console.error(`[REFUND WEBHOOK] Refund for OrderId ${originalMerchantOrderId} failed.`);
                break;
            case "PENDING":
                newRefundStatus = "Refund Pending";
                break;
            default:
                break;
        }

        // Update the booking status in your database
        booking.refundStatus = newRefundStatus;
        booking.status = newBookingStatus;
        
        await booking.save();

        // 💡 Respond with a 200 OK
        // It's crucial to send a 200 OK response to the webhook to prevent PhonePe from retrying.
        return res.status(200).json({ status: "OK" });

    } catch (err) {
        console.error("[REFUND WEBHOOK] Error processing webhook:", err);
        return res.status(500).json({ status: "Failure", message: "Internal server error." });
    }
});

module.exports = router;