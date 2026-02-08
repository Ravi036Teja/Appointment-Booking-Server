// const express = require("express");
// const mongoose = require("mongoose");
// const pgSdk = require("pg-sdk-node");
// const { randomUUID } = require("crypto");
// const crypto = require("crypto");
// require("dotenv").config();
// const Booking = require("../models/Booking");
// const axios = require("axios");
// const { sendWhatsAppConfirmation, sendAdminNotification } = require("../services/msg91Services");
// const BlockedSlot = require("../models/BlockedSlot");
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
//  * 1️⃣ Check Availability
//  * This is a quick, non-destructive check that the frontend uses.
//  */
// router.get("/check-availability/:date/:timeSlot", async (req, res) => {
//     try {
//         const { date, timeSlot } = req.params;

//         const existingBooking = await Booking.findOne({
//             date,
//             timeSlot,
//             status: { $in: ["Pending", "Paid"] },
//         });

//         if (existingBooking) {
//             return res.status(409).json({ error: "This slot is no longer available." });
//         }

//         return res.status(200).json({ message: "Slot is available." });
//     } catch (err) {
//         console.error("[CHECK-AVAILABILITY] Error:", err);
//         res.status(500).json({ error: "Server error during availability check." });
//     }
// });


// /**
//  * 2️⃣ Initiate Payment (Updated)
//  * This now combines the availability check and payment creation into one atomic step.
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

//         const existingBooking = await Booking.findOne({
//             date,
//             timeSlot,
//             status: { $in: ["Pending", "Paid"] }
//         }).session(session);

//         if (existingBooking) {
//             await session.abortTransaction();
//             session.endSession();
//             // This is the race condition check on the backend
//             return res.status(409).json({ error: "This slot is already booked or is being processed." });
//         }

//         // --- 🚨 NEW: CHECK FOR BLOCKED DATES 🚨 ---
//     const blockedDate = await BlockedSlot.findOne({ date }).session(session);
//     if (blockedDate) {
//         // Check if the entire day is blocked (timeSlots is an empty array)
//         if (blockedDate.timeSlots.length === 0) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(409).json({ error: blockedDate.message || "This date has been blocked by the admin." });
//         }
//         // Check if a specific time slot is blocked
//         if (blockedDate.timeSlots.includes(timeSlot)) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(409).json({ error: blockedDate.message || "This time slot has been blocked by the admin." });
//         }
//     }
//     // --- 🚨 END OF NEW CHECK 🚨 ---

//         const merchantOrderId = randomUUID();
//         const amountInPaise = 100 * 100;
        

//         const booking = await Booking.create([{
//             name,
//             phone,
//             date,
//             timeSlot,
//             userLanguage,
//             amount: 100,
//             merchantOrderId,
//             status: "Pending",
//         }], { session });

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
//  * 3️⃣ Redirect Handler (same as before)
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
        const { name, phone, date, timeSlot, userLanguage, frontendUrl } = req.body;
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
            frontendUrl: frontendUrl || process.env.FRONTEND_URL // Fallback to env
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
            return res.redirect(`${process.env.FRONTEND_URL}/payment-result?status=failure`);
        }
        const booking = await Booking.findOne({ merchantOrderId }).session(session);
        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.redirect(`${process.env.FRONTEND_URL}/payment-result?status=failure`);
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
            const url = `${process.env.FRONTEND_URL}/payment-result?status=success&txnId=${txnId}&orderId=${merchantOrderId}&amount=${booking.amount}&name=${encodeURIComponent(booking.name)}&phone=${booking.phone}&date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.timeSlot)}`;
            return res.redirect(url);
        } else {
            return res.redirect(`${process.env.FRONTEND_URL}/payment-result?status=${bookingStatus.toLowerCase()}&orderId=${merchantOrderId}`);
        }
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[REDIRECT] Error:", err);
        return res.redirect(`${process.env.FRONTEN_DURL}/payment-result?status=failure`);
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