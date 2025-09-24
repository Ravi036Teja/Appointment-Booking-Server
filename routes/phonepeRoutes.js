// const express = require("express");
// const mongoose = require("mongoose");
// const pgSdk = require("pg-sdk-node"); // ✅ This is the correct way to import the module
// const { randomUUID } = require("crypto");
// const crypto = require("crypto");
// require("dotenv").config();
// const Booking = require("../models/Booking");
// const axios = require("axios");
// const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");

// const router = express.Router();

// const {
//     PHONEPE_CLIENT_ID,
//     PHONEPE_CLIENT_SECRET,
//     PHONEPE_CLIENT_VERSION,
//     ENV,
//     REDIRECT_URL,
//     FRONTEND_URL,
// } = process.env;


// const client = pgSdk.StandardCheckoutClient.getInstance(
//     PHONEPE_CLIENT_ID,
//     PHONEPE_CLIENT_SECRET,
//     parseInt(PHONEPE_CLIENT_VERSION),
//     ENV === "PROD" ? pgSdk.Env.PRODUCTION : pgSdk.Env.SANDBOX
// );

// /**
//  * 1️⃣ Initiate Payment
//  */
// router.post("/pay", async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { name, phone, date, timeSlot, userLanguage } = req.body;
//         if (!name || !phone || !date || !timeSlot) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).json({ error: "Missing fields" });
//         }

//         const existingBooking = await Booking.findOne({ date, timeSlot, status: { $in: ["Pending", "Paid"] } }).session(session);

//         if (existingBooking) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(409).json({ error: "This slot is already booked or is being processed." });
//         }

//         const merchantOrderId = randomUUID();
//         const amountInPaise = 1 * 100;

//         const booking = await Booking.create([{
//             name,
//             phone,
//             date,
//             timeSlot,
//             userLanguage,
//             amount: 100,
//             merchantOrderId,
//             status: "Pending",
//             isHeld: true
//         }], { session });

//         // ✅ Access StandardCheckoutPayRequest directly from pgSdk
//         const payRequest = pgSdk.StandardCheckoutPayRequest.builder()
//             .merchantOrderId(merchantOrderId)
//             .amount(amountInPaise)
//             .redirectUrl(`${REDIRECT_URL}?merchantOrderId=${merchantOrderId}`)
//             .build();

//         const response = await client.pay(payRequest);

//         if (response?.redirectUrl) {
//             await session.commitTransaction();
//             session.endSession();
//             return res.json({ redirectUrl: response.redirectUrl, merchantOrderId, bookingId: booking[0]._id });
//         } else {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(500).json({ error: "No redirect URL from PhonePe", response });
//         }
//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("[PAY] Error:", err);
//         res.status(500).json({ error: err.message });
//     }
// });

// /**
//  * 2️⃣ Redirect Handler
//  */
// router.get("/redirect-handler", async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { merchantOrderId } = req.query;
//         if (!merchantOrderId) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//         }

//         const booking = await Booking.findOne({ merchantOrderId }).session(session);

//         if (!booking) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//         }

//         const statusResp = await client.getOrderStatus(merchantOrderId);

//         let state = "PENDING";
//         let txnId = "NA";
//         if (statusResp) {
//             if (statusResp.state) state = statusResp.state.toUpperCase();
//             if (statusResp.transactionId) txnId = statusResp.transactionId;
//             else if (statusResp.data?.transactionId) txnId = statusResp.data.transactionId;
//             else if (statusResp.order?.transactionId) txnId = statusResp.order.transactionId;
//         }

//         let bookingStatus = "Pending";
//         let refundStatus = "Not Refunded";
//         if (state === "COMPLETED") bookingStatus = "Paid";
//         else if (state === "FAILED" || state === "EXPIRED") bookingStatus = "Failed";

//         booking.status = bookingStatus;
//         booking.isHeld = false;
//         booking.refundStatus = refundStatus;
//         booking.paymentDetails = booking.paymentDetails || {};
//         booking.paymentDetails.phonepeTransactionId = txnId;

//         await booking.save({ session });
//         await session.commitTransaction();
//         session.endSession();

//         if (bookingStatus === "Paid") {
//             try {
//                 await sendWhatsAppConfirmation(booking.name, booking.phone, booking.date, booking.timeSlot, booking.userLanguage);
//                 await sendAdminNotification(booking.name, booking.phone, booking.date, booking.timeSlot, booking.amount);
//             } catch (msgErr) {
//                 console.error("[REDIRECT] WhatsApp/Notification Error:", msgErr);
//             }
//             const url = `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
//             return res.redirect(url);
//         } else {
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
//         }
//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("[REDIRECT] Error:", err);
//         return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }
// });


// /**
//  * 3️⃣ Refund a payment from the Admin Panel
//  */
// router.post("/refund", async (req, res) => {
//     const { merchantOrderId } = req.body;
    
//     if (!merchantOrderId) {
//         return res.status(400).json({ error: "Missing merchantOrderId" });
//     }

//     try {
//         const booking = await Booking.findOne({ merchantOrderId });

//         if (!booking) {
//             return res.status(404).json({ error: "Booking not found" });
//         }

//         if (booking.status !== "Paid" || booking.refundStatus !== "Not Refunded") {
//             return res.status(400).json({ error: "Cannot refund a non-paid or already-refunded booking." });
//         }

//         const merchantRefundId = crypto.randomUUID();
//         const amountInPaise = booking.amount * 100;
//         const phonepeClientId = process.env.PHONEPE_CLIENT_ID;
//         const phonepeClientSecret = process.env.PHONEPE_CLIENT_SECRET;
//         const saltIndex = "1"; // PhonePe V2 API requires the salt index in the checksum

//         // 1. Construct the refund request object
//         const refundRequest = {
//             merchantId: phonepeClientId,
//             merchantRefundId: merchantRefundId,
//             originalMerchantOrderId: merchantOrderId,
//             amount: amountInPaise,
//         };

//         // 2. Convert the request object to a Base64 encoded string
//         const payloadString = JSON.stringify(refundRequest);
//         const payloadBase64 = Buffer.from(payloadString).toString('base64');

//        // 3. Construct the checksum string
// // 3. Construct the checksum string
// const checksumPath = process.env.ENV === 'PROD'
//     ? "/pg/v2/refund"
//     : "/apis/pg-sandbox/v2/refund"; // Correct path for UAT/Sandbox

// const xVerifyString = payloadBase64 + checksumPath + phonepeClientSecret;
// const checksum = crypto.createHash('sha256').update(xVerifyString).digest('hex') + "###" + saltIndex;

// // 4. Set up the API call
// const apiUrl = process.env.ENV === 'PROD'
//     ? 'https://api.phonepe.com/apis/pg/v2/refund' // Production
//     : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v2/refund'; // UAT/Sandbox
//         console.log("Making API call to:", apiUrl);
//         console.log("Payload:", refundRequest);
//         console.log("Checksum String:", xVerifyString);
//         console.log("Generated Checksum:", checksum);

//         const apiResponse = await axios.post(
//             apiUrl, 
//             { request: payloadBase64 }, 
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'X-VERIFY': checksum,
//                 },
//             }
//         );

//         if (apiResponse.data?.success) {
//             booking.refundStatus = "Refund Initiated";
//             booking.status = "Cancelled";
//             booking.refundDetails = {
//                 merchantRefundId: merchantRefundId,
//                 response: apiResponse.data,
//             };
//             await booking.save();
//             return res.json({ message: "Refund initiated successfully." });
//         } else {
//             console.error("PhonePe Refund API Error:", apiResponse.data);
//             booking.refundStatus = "Refund Failed";
//             await booking.save();
//             return res.status(500).json({ error: "Failed to initiate refund with PhonePe." });
//         }
//     } catch (err) {
//         console.error("[REFUND] Error:", err.response ? err.response.data : err.message);
//         res.status(500).json({ error: "An unexpected error occurred." });
//     }
// });




// /**
//  * 4️⃣ PhonePe Refund Webhook Handler
//  */
// router.post("/refund-callback", async (req, res) => {
//     const { body } = req;
    
//     // 💡 Security Check: Verify the signature
//     // You should use the same logic here as in the main payment callback to ensure the request is from PhonePe.
//     // The details for signature verification will be in your PhonePe SDK or documentation.
    
//     if (!body || !body.data || !body.data.merchantRefundId || !body.data.state) {
//         console.error("[REFUND WEBHOOK] Invalid payload received.");
//         return res.status(400).json({ status: "Failure", message: "Invalid payload." });
//     }

//     const { merchantRefundId, state } = body.data;
//     const originalMerchantOrderId = body.data.merchantOrderId;

//     try {
//         const booking = await Booking.findOne({ merchantOrderId: originalMerchantOrderId });

//         if (!booking) {
//             console.error(`[REFUND WEBHOOK] Booking with merchantOrderId ${originalMerchantOrderId} not found.`);
//             return res.status(404).json({ status: "Failure", message: "Booking not found." });
//         }

//         let newRefundStatus = "Pending";
//         let newBookingStatus = booking.status;

//         switch (state) {
//             case "COMPLETED":
//                 newRefundStatus = "Refunded";
//                 newBookingStatus = "Cancelled"; // Change the booking status to cancelled after a successful refund
//                 console.log(`[REFUND WEBHOOK] Refund for OrderId ${originalMerchantOrderId} completed.`);
//                 break;
//             case "FAILED":
//                 newRefundStatus = "Refund Failed";
//                 newBookingStatus = "Refund Failed"; // A new status to indicate refund failed
//                 console.error(`[REFUND WEBHOOK] Refund for OrderId ${originalMerchantOrderId} failed.`);
//                 break;
//             case "PENDING":
//                 newRefundStatus = "Refund Pending";
//                 break;
//             default:
//                 break;
//         }

//         // Update the booking status in your database
//         booking.refundStatus = newRefundStatus;
//         booking.status = newBookingStatus;
        
//         await booking.save();

//         // 💡 Respond with a 200 OK
//         // It's crucial to send a 200 OK response to the webhook to prevent PhonePe from retrying.
//         return res.status(200).json({ status: "OK" });

//     } catch (err) {
//         console.error("[REFUND WEBHOOK] Error processing webhook:", err);
//         return res.status(500).json({ status: "Failure", message: "Internal server error." });
//     }
// });

// module.exports = router;





const express = require("express");
const mongoose = require("mongoose");
const pgSdk = require("pg-sdk-node");
const { randomUUID } = require("crypto");
const crypto = require("crypto");
require("dotenv").config();
const Booking = require("../models/Booking");
const axios = require("axios");
const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");
const BlockedSlot = require("../models/BlockedSlot");
const router = express.Router();

const {
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    PHONEPE_CLIENT_VERSION,
    ENV,
    REDIRECT_URL,
    FRONTEND_URL,
} = process.env;

const client = pgSdk.StandardCheckoutClient.getInstance(
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    parseInt(PHONEPE_CLIENT_VERSION),
    ENV === "PROD" ? pgSdk.Env.PRODUCTION : pgSdk.Env.SANDBOX
);

/**
 * 1️⃣ Check Availability
 * This is a quick, non-destructive check that the frontend uses.
 */
router.get("/check-availability/:date/:timeSlot", async (req, res) => {
    try {
        const { date, timeSlot } = req.params;

        const existingBooking = await Booking.findOne({
            date,
            timeSlot,
            status: { $in: ["Pending", "Paid"] },
        });

        if (existingBooking) {
            return res.status(409).json({ error: "This slot is no longer available." });
        }

        return res.status(200).json({ message: "Slot is available." });
    } catch (err) {
        console.error("[CHECK-AVAILABILITY] Error:", err);
        res.status(500).json({ error: "Server error during availability check." });
    }
});


/**
 * 2️⃣ Initiate Payment (Updated)
 * This now combines the availability check and payment creation into one atomic step.
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

        const existingBooking = await Booking.findOne({
            date,
            timeSlot,
            status: { $in: ["Pending", "Paid"] }
        }).session(session);

        if (existingBooking) {
            await session.abortTransaction();
            session.endSession();
            // This is the race condition check on the backend
            return res.status(409).json({ error: "This slot is already booked or is being processed." });
        }

        // --- 🚨 NEW: CHECK FOR BLOCKED DATES 🚨 ---
    const blockedDate = await BlockedSlot.findOne({ date }).session(session);
    if (blockedDate) {
        // Check if the entire day is blocked (timeSlots is an empty array)
        if (blockedDate.timeSlots.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ error: blockedDate.message || "This date has been blocked by the admin." });
        }
        // Check if a specific time slot is blocked
        if (blockedDate.timeSlots.includes(timeSlot)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ error: blockedDate.message || "This time slot has been blocked by the admin." });
        }
    }
    // --- 🚨 END OF NEW CHECK 🚨 ---

        const merchantOrderId = randomUUID();
        const amountInPaise = 100 * 100;
        

        const booking = await Booking.create([{
            name,
            phone,
            date,
            timeSlot,
            userLanguage,
            amount: 100,
            merchantOrderId,
            status: "Pending",
        }], { session });

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
 * 3️⃣ Redirect Handler (same as before)
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

// router.get("/redirect-handler", async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { merchantOrderId } = req.query;

//         if (!merchantOrderId) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//         }

//         const booking = await Booking.findOne({ merchantOrderId }).session(session);

//         if (!booking) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//         }

//         // Get the final payment status from PhonePe
//         const statusResp = await client.getOrderStatus(merchantOrderId);

//         let state = "PENDING";
//         let txnId = "NA";

//         if (statusResp) {
//             if (statusResp.state) state = statusResp.state.toUpperCase();
//             if (statusResp.transactionId) txnId = statusResp.transactionId;
//         }

//         let bookingStatus = "Pending";
//         if (state === "COMPLETED") {
//             bookingStatus = "Paid";
//         } else if (state === "FAILED" || state === "EXPIRED") {
//             bookingStatus = "Failed";
//         }

//         // Update the booking details in the database
//         booking.status = bookingStatus;
//         booking.paymentDetails = booking.paymentDetails || {};
//         booking.paymentDetails.phonepeTransactionId = txnId;
//         await booking.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         // **DO NOT SEND MESSAGES HERE**
//         // The webhook will handle it to prevent duplicates.

//         // Redirect to the frontend results page
//         if (bookingStatus === "Paid") {
//             const url = `${FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
//             return res.redirect(url);
//         } else {
//             return res.redirect(`${FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
//         }
//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("[REDIRECT] Error:", err);
//         return res.redirect(`${FRONTEND_URL}/payment-result?status=failure`);
//     }
// });

// router.post("/payment-callback", express.raw({ type: '*/*' }), async (req, res) => {
//     // Start a transaction for atomicity
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const xVerify = req.headers['x-verify'];

//         // PhonePe sends the payload as a raw Base64 string in the body.
//         const payloadBase64 = req.body.toString('base64');
//         const phonepeClientSecret = process.env.PHONEPE_CLIENT_SECRET;
//         const saltIndex = "1";

//         // 1. Validate the signature
//         const checksumString = payloadBase64 + phonepeClientSecret;
//         const generatedChecksum = crypto.createHash('sha256').update(checksumString).digest('hex') + "###" + saltIndex;

//         if (xVerify !== generatedChecksum) {
//             console.error("[PAYMENT WEBHOOK] Signature verification failed. x-verify: ", xVerify, " Generated: ", generatedChecksum);
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).send("Bad Request: Signature mismatch");
//         }

//         // 2. Decode the Base64 payload and parse JSON
//         const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
//         const payload = JSON.parse(decodedPayload);
//         const { merchantId, transactionId, merchantOrderId, state } = payload.data;

//         console.log(`[PAYMENT WEBHOOK] Webhook received for order ID: ${merchantOrderId} with state: ${state}`);

//         // 3. Find the booking and check if it's already "Paid" (Idempotency Check)
//         const booking = await Booking.findOne({ merchantOrderId }).session(session);

//         if (!booking) {
//             console.error(`[PAYMENT WEBHOOK] Booking not found for order ID: ${merchantOrderId}`);
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(404).json({ status: "Failure", message: "Booking not found." });
//         }
        
//         // This is the CRUCIAL idempotency check to prevent duplicate messages
//         if (booking.status === "Paid") {
//             console.log(`[PAYMENT WEBHOOK] Booking for order ID ${merchantOrderId} already processed. Acknowledging webhook.`);
//             await session.commitTransaction();
//             session.endSession();
//             return res.status(200).json({ status: "Success" });
//         }
        
//         // 4. Update the booking status if it's a new "COMPLETED" transaction
//         if (state === "COMPLETED") {
//             booking.status = "Paid";
//             booking.paymentDetails = booking.paymentDetails || {};
//             booking.paymentDetails.phonepeTransactionId = transactionId;
//             await booking.save({ session });
            
//             // Commit the transaction after the save to release the lock
//             await session.commitTransaction();
//             session.endSession();

//             // 5. Send messages now that the database update is complete
//             try {
//                 await sendWhatsAppConfirmation(booking.name, booking.phone, booking.date, booking.timeSlot, booking.userLanguage);
//                 await sendAdminNotification(booking.name, booking.phone, booking.date, booking.timeSlot, booking.amount);
//                 console.log(`[PAYMENT WEBHOOK] Messages sent for Order ID ${merchantOrderId}.`);
//             } catch (msgErr) {
//                 console.error("[PAYMENT WEBHOOK] Message sending failed:", msgErr);
//                 // Important: Do not return an error status here. We've already committed the transaction,
//                 // and the booking status is updated. We've done our best to send the message.
//             }
//         } else {
//             // Handle other states like "FAILED" or "EXPIRED"
//             booking.status = state;
//             await booking.save({ session });
//             await session.commitTransaction();
//             session.endSession();
//         }
        
//         // 6. Always respond with a 200 OK to the webhook
//         return res.status(200).json({ status: "Success" });

//     } catch (err) {
//         // Rollback the transaction on error
//         await session.abortTransaction();
//         session.endSession();
//         console.error("[PAYMENT WEBHOOK] Error:", err);
//         res.status(500).json({ status: "Failure", message: "Internal server error." });
//     }
// });
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