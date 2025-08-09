// v2 configuration

// Thank you for providing the specific URLs from the V2 documentation. This is exactly what we needed to build a precise and correct implementation.

// Based on these URLs, the V2 API uses different host paths for each endpoint. I have completely rewritten the code to match these new specifications. This new version is a definitive implementation for the V2 API.

// Please use this code and ensure you have updated your environment variables with the new **V2 credentials**. This version of the code should work smoothly in production.

// ### `phonepeRoutes.js` (V2 Implementation - Final)


// ### Step 2: Updated `phonepeRoutes.js`

// Replace the entire contents of your `phonepeRoutes.js` file with this code. This version correctly initializes the `StandardCheckoutClient` and uses its methods for all API interactions.
// const express = require("express");
// const crypto = require("crypto");
// const { randomUUID } = require('crypto');
// const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, RefundRequest } = require('pg-sdk-node');
// const Booking = require("../models/Booking");
// const router = express.Router();

// // --- Configuration ---
// // Make sure these are set in your environment variables for production.
// const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY; // This might be the same as SALT_KEY for UAT
// const CLIENT_VERSION = 1;
// const ENV = Env.SANDBOX; // Change to Env.PRODUCTION for live environment

// // --- SDK Initialization ---
// const client = StandardCheckoutClient.getInstance(MERCHANT_ID, CLIENT_SECRET, CLIENT_VERSION, ENV);

// // Production URLs for callbacks and redirects
// const REDIRECT_URL = "https://5fb528d72ef1.ngrok-free.app/api/phonepe/redirect-handler";
// const CALLBACK_URL = "https://5fb528d72ef1.ngrok-free.app/api/phonepe/callback";

// // --- Endpoint to initiate a payment ---
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, amount } = req.body;

//     if (!name || !phone || !date || !timeSlot || !amount) {
//       console.error("Missing required booking information.");
//       return res.status(400).json({ message: "Missing required booking information." });
//     }
    
//     const existingBooking = await Booking.findOne({
//       date,
//       timeSlot,
//       status: { $in: ["Paid", "Pending"] },
//     });
//     if (existingBooking) {
//       console.error("Slot is already taken.");
//       return res.status(409).json({
//         message: "This slot is already taken. Please choose another one.",
//       });
//     }

//     const newBooking = new Booking({
//       date,
//       timeSlot,
//       name,
//       phone,
//       amount,
//       status: "Pending",
//     });
//     await newBooking.save();
    
//     const merchantOrderId = newBooking._id.toString();

//     console.log("--- Starting Payment Initiation via PhonePe SDK ---");

//     // Corrected request builder - removed the non-existent .callbackUrl() method
//     const payRequest = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(amount * 100) // Amount in paise
//       .redirectUrl(REDIRECT_URL)
//       .build();

//     const response = await client.pay(payRequest);

//     console.log("Payment Initiation Response Data:", response);

//     if (response && response.redirectUrl) {
//       console.log("Payment initiated successfully. Redirecting user.");
//       res.status(200).json({
//         success: true,
//         message: "Payment initiated successfully",
//         redirectUrl: response.redirectUrl,
//       });
//     } else {
//       console.error("Payment initiation failed: no redirect URL found in response.");
//       res.status(500).json({ 
//         message: "Payment initiation failed: no redirect URL.",
//         error: response
//       });
//     }

//   } catch (error) {
//     console.error("An unexpected error occurred during payment initiation:", error.response?.data || error.message);
    
//     const errorMessage = error.response?.data?.message || error.message || error;
//     res.status(500).json({
//       message: "Server error during payment initiation. Please try again later.",
//       error: errorMessage,
//     });
//   }
// });

// // --- Endpoint to handle PhonePe's POST redirect ---
// // Endpoint to handle PhonePe's redirect after payment (GET request)
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     // PhonePe sends the data as query parameters for GET requests
//     const { code, transactionId } = req.query;

//     console.log("Redirect Handler received a response:", req.query);

//     const status = code === "PAYMENT_SUCCESS" ? "success" : "failure";

//     // You can add logic here to update your database
//     // For now, let's just redirect to the frontend with the status
//     res.redirect(`http://localhost:5173/payment-success?status=${status}&transactionId=${transactionId}`);
//   } catch (error) {
//     console.error("Error in redirect handler:", error.message);
//     res.redirect("http://localhost:5173/payment-failure?error=redirect-failed");
//   }
// });

// // --- Webhook endpoint to receive payment status from PhonePe ---
// router.post("/callback", async (req, res) => {
//   try {
//     // Validate the callback with the SDK
//     const callbackResponse = client.validateCallback(req.headers.authorization, req.body);
//     console.log("Validated Callback Response:", callbackResponse);

//     if (!callbackResponse || callbackResponse.payload.state === 'FAILED') {
//       console.error("Webhook validation failed or payment failed.");
//       // Send a 400 response to indicate failure
//       return res.status(400).send({ message: "Invalid callback or failed payment" });
//     }
//     
//     const { merchantOrderId, state } = callbackResponse.payload;

//     if (state === "COMPLETED") {
//       // Update the booking to "Paid" if the state is completed
//       await Booking.findByIdAndUpdate(merchantOrderId, { status: "Paid" });
//       console.log(`Booking for transaction ${merchantOrderId} marked as Paid.`);
//     } else {
//       // Update the booking to "Failed" for other states
//       await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
//       console.log(`Booking for transaction ${merchantOrderId} marked as Failed.`);
//     }

//     // Send a 200 response to acknowledge receipt of the webhook
//     res.status(200).send("OK");
//   } catch (error) {
//     console.error("Failed to process webhook callback:", error.message);
//     // Handle errors gracefully
//     res.status(500).send({
//       message: "Failed to process callback",
//       error: error.message,
//     });
//   }
// });

// // --- Endpoint to check the status of a specific transaction ---
// router.get("/status/:transactionId", async (req, res) => {
//   try {
//     const { transactionId } = req.params;
//     console.log("Checking status for transaction ID:", transactionId);

//     const response = await client.getOrderStatus(transactionId);
//     console.log("Order Status Response Data:", response);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Failed to get payment status:", error.response?.data || error.message);
//     res.status(500).send({
//       message: "Failed to get payment status",
//       error: error.response?.data || error.message,
//     });
//   }
// });

// // --- Endpoint for Refund API ---
// router.post("/refund", async (req, res) => {
//   try {
//     const { originalMerchantOrderId, amount } = req.body;
//     const merchantRefundId = randomUUID();
//     console.log("Starting refund for transaction:", originalMerchantOrderId);

//     const refundRequest = RefundRequest.builder()
//         .amount(amount * 100) // Amount in paise
//         .merchantRefundId(merchantRefundId)
//         .originalMerchantOrderId(originalMerchantOrderId)
//         .build();

//     const response = await client.refund(refundRequest);
//     console.log("Refund Response Data:", response);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Failed to process refund:", error.response?.data || error.message);
//     res.status(500).send({
//       message: "Failed to process refund",
//       error: error.response?.data || error.message,
//     });
//   }
// });

// module.exports = router;


// const express = require("express");
// const crypto = require("crypto");
// const { randomUUID } = require('crypto');
// const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, RefundRequest } = require('pg-sdk-node');
// const Booking = require("../models/Booking");
// const router = express.Router();

// // --- Configuration ---
// const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY;
// const CLIENT_VERSION = 1;
// const ENV = Env.PRODUCTION; // Change to Env.PRODUCTION for live environment

// const client = StandardCheckoutClient.getInstance(MERCHANT_ID, CLIENT_SECRET, CLIENT_VERSION, ENV);

// // Production URLs for callbacks and redirects.
// // NOTE: Use your actual production domain, not the Render URL, for the client-side redirect.
// const REDIRECT_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/redirect-handler";
// const CALLBACK_URL_PATH = "/bookings/phonepe-callback";

// // --- Endpoint to initiate a payment ---
// router.post("/pay", async (req, res) => {
//     try {
//         const { name, phone, date, timeSlot, amount } = req.body;

//         if (!name || !phone || !date || !timeSlot || !amount) {
//             return res.status(400).json({ message: "Missing required booking information." });
//         }
        
//         // 1. Check for existing booking (pending or paid) to prevent duplicate transactions
//         const existingBooking = await Booking.findOne({
//             date,
//             timeSlot,
//             status: { $in: ["Paid", "Pending"] },
//         });
//         if (existingBooking) {
//             return res.status(409).json({ message: "This slot is already taken. Please choose another one." });
//         }

//         // 2. Create a new booking with 'Pending' status.
//         // The ID of this booking will be our merchantOrderId.
//         const newBooking = new Booking({
//             date,
//             timeSlot,
//             name,
//             phone,
//             amount,
//             status: "Pending",
//         });
//         await newBooking.save();
        
//         const merchantOrderId = newBooking._id.toString();

//         // 3. Initiate payment via PhonePe SDK
//         const payRequest = StandardCheckoutPayRequest.builder()
//             .merchantOrderId(merchantOrderId)
//             .amount(amount * 100)
//             .redirectUrl(REDIRECT_URL)
//             .callbackUrl(`https://appointment-booking-server-o5c5.onrender.com/api${CALLBACK_URL_PATH}`)
//             .build();

//         const response = await client.pay(payRequest);

//         if (response && response.redirectUrl) {
//             res.status(200).json({
//                 success: true,
//                 message: "Payment initiated successfully",
//                 redirectUrl: response.redirectUrl,
//             });
//         } else {
//             console.error("Payment initiation failed: no redirect URL found in response.");
//             // If payment fails to initiate, mark the booking as failed and inform the user.
//             await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
//             res.status(500).json({ 
//                 message: "Payment initiation failed: no redirect URL.",
//                 error: response
//             });
//         }

//     } catch (error) {
//         console.error("An unexpected error occurred during payment initiation:", error.response?.data || error.message);
//         res.status(500).json({
//             message: "Server error during payment initiation. Please try again later.",
//             error: error.response?.data?.message || error.message || error,
//         });
//     }
// });

// // --- Endpoint to handle PhonePe's redirect after payment ---
// // This endpoint is for user experience. The definitive status comes from the callback.
// router.get("/redirect-handler", async (req, res) => {
//   try {
//     const { transactionId } = req.query;

//     if (!transactionId) {
//       console.error("No transactionId found in redirect handler.");
//       // Redirect to a specific failure page if no transaction ID is present
//       return res.redirect("http://localhost:5173/payment-failure?error=no-transaction-id");
//     }

//     // Call the PhonePe API to get the definitive transaction status
//     const response = await client.getOrderStatus(transactionId);
//     const transactionState = response.payload.state;
//     console.log("Final payment status from PhonePe for transaction", transactionId, ":", transactionState);

//     let status;
//     if (transactionState === "COMPLETED") {
//       status = "success";
//     } else if (transactionState === "PENDING") {
//       // Handle the pending state separately
//       status = "pending";
//     } else {
//       // All other states (FAILED, CANCELLED, etc.) are treated as a failure for the user
//       status = "failure";
//     }

//     // Redirect the user to the frontend with the determined status
//     // It's recommended to have a dedicated page to display the result.
//     res.redirect(`https://manjunathrajpurohit.in/payment-result?status=${status}&transactionId=${transactionId}`);

//   } catch (error) {
//     // Catch any errors during the API call itself
//     console.error("Error in redirect handler during status check:", error.response?.data || error.message);
//     // Redirect to a generic error page on the frontend
//     res.redirect(`https://manjunathrajpurohit.in/payment-result?status=failure&error=redirect-failed`);
//   }
// });

// // --- Webhook endpoint to receive payment status from PhonePe (POST request) ---
// // THIS IS THE MOST RELIABLE SOURCE OF TRUTH.
// router.post(CALLBACK_URL_PATH, async (req, res) => {
//   try {
//     const callbackResponse = client.validateCallback(req.headers.authorization, req.body);

//     if (!callbackResponse) {
//       console.error("Webhook validation failed.");
//       return res.status(400).send({ message: "Invalid callback signature" });
//     }

//     const { merchantOrderId, state } = callbackResponse.payload;
//     console.log(`Callback for order ${merchantOrderId} received with state: ${state}`);

//     // Fetch the booking to prevent double-updates
//     const booking = await Booking.findById(merchantOrderId);
//     if (!booking) {
//         console.error(`Booking with ID ${merchantOrderId} not found.`);
//         return res.status(404).send("Booking not found");
//     }

//     if (booking.status === "Paid" || booking.status === "Failed") {
//         console.log(`Booking ${merchantOrderId} already processed. State: ${booking.status}`);
//         return res.status(200).send("OK");
//     }

//     if (state === "COMPLETED") {
//         // Update the booking to "Paid"
//         booking.status = "Paid";
//         await booking.save();

//         console.log(`Booking for transaction ${merchantOrderId} marked as Paid.`);

//         // Send confirmation message
//         try {
//             const message = `🙏 Hi ${booking.name}, your appointment for ${booking.date} at ${booking.timeSlot} is now confirmed.`;
//             // Assuming sendWhatsAppMessage is correctly defined
//             // await sendWhatsAppMessage(booking.phone, message);
//             console.log("WhatsApp message sent successfully for booking:", merchantOrderId);
//         } catch (whatsappErr) {
//             console.error("Failed to send WhatsApp message:", whatsappErr);
//         }
//     } else {
//         // Update the booking to "Failed" for any other state
//         booking.status = "Failed";
//         await booking.save();
//         console.log(`Booking for transaction ${merchantOrderId} marked as Failed.`);
//     }

//     res.status(200).send("OK");
//   } catch (error) {
//     console.error("Failed to process webhook callback:", error.message);
//     res.status(500).send({ message: "Failed to process callback", error: error.message });
//   }
// });

// // --- Endpoint to check the status of a specific transaction ---
// router.get("/status/:transactionId", async (req, res) => {
//   try {
//     const { transactionId } = req.params;
//     console.log("Checking status for transaction ID:", transactionId);

//     const response = await client.getOrderStatus(transactionId);
//     console.log("Order Status Response Data:", response);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Failed to get payment status:", error.response?.data || error.message);
//     res.status(500).send({
//       message: "Failed to get payment status",
//       error: error.response?.data || error.message,
//     });
//   }
// });

// // --- Endpoint for Refund API ---
// router.post("/refund", async (req, res) => {
//   try {
//     const { originalMerchantOrderId, amount } = req.body;
//     const merchantRefundId = randomUUID();
//     console.log("Starting refund for transaction:", originalMerchantOrderId);

//     const refundRequest = RefundRequest.builder()
//         .amount(amount * 100) // Amount in paise
//         .merchantRefundId(merchantRefundId)
//         .originalMerchantOrderId(originalMerchantOrderId)
//         .build();

//     const response = await client.refund(refundRequest);
//     console.log("Refund Response Data:", response);
//     res.status(200).send(response);
//   } catch (error) {
//     console.error("Failed to process refund:", error.response?.data || error.message);
//     res.status(500).send({
//       message: "Failed to process refund",
//       error: error.response?.data || error.message,
//     });
//   }
// });

// module.exports = router;
// const express = require("express");
// const crypto = require("crypto");
// const { randomUUID } = require('crypto');
// const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, RefundRequest } = require('pg-sdk-node');
// const Booking = require("../models/Booking");
// const router = express.Router();

// // --- Configuration ---
// // You should store these credentials in environment variables
// const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY;
// const CLIENT_VERSION = 1;
// const ENV = Env.PRODUCTION; // Change to Env.PRODUCTION for live environment

// const client = StandardCheckoutClient.getInstance(MERCHANT_ID, CLIENT_SECRET, CLIENT_VERSION, ENV);

// // Production URLs for callbacks and redirects.
// const REDIRECT_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/redirect-handler";
// const CALLBACK_URL = "https://appointment-booking-server-o5c5.onrender.com/api/bookings/phonepe-callback";

// // --- Endpoint to initiate a payment ---
// router.post("/pay", async (req, res) => {
//     try {
//         const { name, phone, date, timeSlot, amount } = req.body;

//         if (!name || !phone || !date || !timeSlot || !amount) {
//             console.error("Missing required booking information for payment initiation.");
//             return res.status(400).json({ message: "Missing required booking information." });
//         }

//         // 1. Check for existing booking (pending or paid) to prevent duplicate transactions
//         const existingBooking = await Booking.findOne({
//             date,
//             timeSlot,
//             status: { $in: ["Paid", "Pending"] },
//         });
//         if (existingBooking) {
//             console.warn(`Attempted to book an already taken slot for ${date} at ${timeSlot}.`);
//             return res.status(409).json({ message: "This slot is already taken. Please choose another one." });
//         }

//         // 2. Create a new booking with 'Pending' status.
//         const newBooking = new Booking({
//             date,
//             timeSlot,
//             name,
//             phone,
//             amount,
//             status: "Pending",
//         });
//         await newBooking.save();
//         console.log(`New booking created with ID: ${newBooking._id}`);

//         const merchantOrderId = newBooking._id.toString();

//         // 3. Initiate payment via PhonePe SDK
//         const payRequest = StandardCheckoutPayRequest.builder()
//             .merchantOrderId(merchantOrderId)
//             .amount(amount * 100) // The amount is in paise
//             .redirectUrl(REDIRECT_URL)
//             .build();

//         console.log(`Initiating PhonePe payment for merchantOrderId: ${merchantOrderId} with amount: ${amount}`);
//         const response = await client.pay(payRequest);

//         if (response && response.redirectUrl) {
//             console.log(`Payment initiation successful. Redirecting user to: ${response.redirectUrl}`);
//             res.status(200).json({
//                 success: true,
//                 message: "Payment initiated successfully",
//                 redirectUrl: response.redirectUrl,
//             });
//         } else {
//             console.error(`Payment initiation failed for merchantOrderId: ${merchantOrderId}. No redirect URL found. Response: ${JSON.stringify(response)}`);
//             await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
//             res.status(500).json({
//                 message: "Payment initiation failed: no redirect URL.",
//                 error: response
//             });
//         }

//     } catch (error) {
//         console.error("An unexpected error occurred during payment initiation:", error.response?.data || error.message);
//         res.status(500).json({
//             message: "Server error during payment initiation. Please try again later.",
//             error: error.response?.data?.message || error.message || error,
//         });
//     }
// });

// // --- Endpoint to handle PhonePe's redirect after payment ---
// router.get("/redirect-handler", async (req, res) => {
//     try {
//         console.log("PhonePe Redirect Query Params:", req.query);
        
//         // Use a more flexible approach to find the transaction ID
//         const merchantTransactionId = req.query.transactionId || req.query.merchantTransactionId;

//         if (!merchantTransactionId) {
//             console.error("No merchantTransactionId or transactionId found in redirect handler.");
//             return res.redirect("https://manjunathrajpurohit.in/payment-failure?error=no-transaction-id");
//         }
        
//         // Find the booking in the database first
//         const booking = await Booking.findById(merchantTransactionId);
        
//         if (!booking) {
//             console.error("Booking not found for merchantTransactionId:", merchantTransactionId);
//             return res.redirect(`https://manjunathrajpurohit.in/payment-failure?error=booking-not-found&transactionId=${merchantTransactionId}`);
//         }

//         console.log(`Attempting to check status for merchantTransactionId: ${merchantTransactionId}`);
//         // Use the PhonePe SDK to query the transaction status
//         const statusResponse = await client.checkStatus(merchantTransactionId);
//         console.log("Status Check API Response:", JSON.stringify(statusResponse, null, 2));

//         if (statusResponse && statusResponse.success && statusResponse.data) {
//             const transactionState = statusResponse.data.state;

//             console.log("Final payment status for transaction", merchantTransactionId, ":", transactionState);

//             let finalStatus;
//             if (transactionState === "COMPLETED") {
//                 booking.status = 'Paid';
//                 finalStatus = "success";
//             } else {
//                 booking.status = 'Failed';
//                 finalStatus = "failure";
//             }
//             await booking.save();
//             console.log(`Booking status updated to ${booking.status} based on redirect handler.`);
            
//             res.redirect(`https://manjunathrajpurohit.in/payment-result?status=${finalStatus}&transactionId=${merchantTransactionId}`);
//         } else {
//             // If the status check API fails, we redirect to failure but let the webhook handle the final status
//             console.error("Failed to get transaction status from PhonePe API. Will rely on webhook for final status.");
//             res.redirect(`https://manjunathrajpurohit.in/payment-failure?error=status-check-failed&transactionId=${merchantTransactionId}`);
//         }

//     } catch (error) {
//         console.error("Error in redirect handler during status check:", error.response?.data || error.message);
//         res.redirect(`https://manjunathrajpurohit.in/payment-result?status=failure&error=redirect-handler-error`);
//     }
// });

// // --- Webhook endpoint to receive payment status from PhonePe (POST request) ---
// router.post('/bookings/phonepe-callback', async (req, res) => {
//     try {
//         const authorizationHeaderData = req.header('X-Verify');
//         const phonepeS2SCallbackResponseBodyString = JSON.stringify(req.body);
        
//         console.log("Webhook received. Headers:", req.headers);
//         console.log("Webhook body:", phonepeS2SCallbackResponseBodyString);

//         // Replace with your configured username and password
//         const usernameConfigured = process.env.PHONEPE_MERCHANT_USERNAME;
//         const passwordConfigured = process.env.PHONEPE_MERCHANT_PASSWORD;

//         const callbackResponse = client.validateCallback(
//             usernameConfigured,
//             passwordConfigured,
//             authorizationHeaderData,
//             phonepeS2SCallbackResponseBodyString
//         );
//         console.log("Webhook validation response:", JSON.stringify(callbackResponse, null, 2));

//         if (callbackResponse && callbackResponse.success) {
//             const state = callbackResponse.payload.state;
//             const merchantTransactionId = callbackResponse.payload.merchantTransactionId;
            
//             console.log(`Webhook validated. State: ${state}, Merchant Transaction ID: ${merchantTransactionId}`);
            
//             const booking = await Booking.findById(merchantTransactionId);

//             if (!booking) {
//                 console.error('Booking not found for merchantTransactionId:', merchantTransactionId);
//                 return res.status(404).send('Booking not found');
//             }

//             if (state === 'COMPLETED') {
//                 booking.status = 'Paid';
//                 booking.paymentDetails = {
//                     ...booking.paymentDetails,
//                     phonepeTransactionId: callbackResponse.payload.transactionId,
//                 };
//                 await booking.save();
//                 console.log(`Booking ${booking.name} updated to Paid via webhook.`);
//                 res.status(200).json({ success: true, message: "Payment successful and booking updated." });
//             } else if (state === 'FAILED' || state === 'EXPIRED') {
//                 booking.status = 'Failed';
//                 await booking.save();
//                 console.log(`Booking for ${booking.name} failed via webhook with state: ${state}. Status updated to Failed.`);
//                 res.status(200).json({ success: true, message: "Payment failed, booking status updated." });
//             } else {
//                 console.log(`Webhook received for state: ${state}. No status change necessary.`);
//                 res.status(200).json({ success: true, message: "Webhook processed, no change in booking status." });
//             }
//         } else {
//             console.error('Callback validation failed:', callbackResponse);
//             res.status(400).send('Invalid callback');
//         }
//     } catch (error) {
//         console.error("Error handling PhonePe callback:", error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// // --- Endpoint to get payment status from PhonePe ---
// router.get("/status/:transactionId", async (req, res) => {
//     try {
//         const { transactionId } = req.params;
//         console.log("Checking status for transaction ID:", transactionId);

//         const response = await client.checkStatus(transactionId);
//         console.log("Order Status Response Data:", JSON.stringify(response, null, 2));
//         res.status(200).send(response);
//     } catch (error) {
//         console.error("Failed to get payment status:", error.response?.data || error.message);
//         res.status(500).send({
//             message: "Failed to get payment status",
//             error: error.response?.data || error.message,
//         });
//     }
// });

// // --- Endpoint for Refund API ---
// router.post("/refund", async (req, res) => {
//     try {
//         const { originalMerchantOrderId, amount } = req.body;
//         const merchantRefundId = randomUUID();
//         console.log("Starting refund for transaction:", originalMerchantOrderId);

//         const refundRequest = RefundRequest.builder()
//             .amount(amount * 100) // Amount in paise
//             .merchantRefundId(merchantRefundId)
//             .originalMerchantOrderId(originalMerchantOrderId)
//             .build();

//         const response = await client.refund(refundRequest);
//         console.log("Refund Response Data:", JSON.stringify(response, null, 2));
//         res.status(200).send(response);
//     } catch (error) {
//         console.error("Failed to process refund:", error.response?.data || error.message);
//         res.status(500).send({
//             message: "Failed to process refund",
//             error: error.response?.data || error.message,
//         });
//     }
// });

// module.exports = router;
// routes/phonepeRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const rawBody = require("raw-body");
const { PhonePePaymentClient, Environment, StandardCheckoutPayRequest, PgCheckoutPaymentFlow, MerchantUrls } = require("phonepe-pg-sdk-node");
const Booking = require("../models/Booking");

// ✅ Initialize PhonePe client
const client = new PhonePePaymentClient({
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX,
    env: process.env.PHONEPE_ENV === "PROD" ? Environment.PRODUCTION : Environment.UAT,
});

// ===== 1. PAY ROUTE =====
router.post("/pay", async (req, res) => {
    try {
        console.log("[PhonePe] /pay request body:", req.body);

        const { name, phone, date, timeSlot, amount } = req.body;
        if (!name || !phone || !date || !timeSlot || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Create booking in DB
        const booking = await Booking.create({
            name,
            phone,
            date,
            timeSlot,
            amount,
            status: "Pending",
        });

        const orderId = booking._id.toString();
        console.log("[PhonePe] Generated Order ID:", orderId);

        // Create PhonePe pay request
        const payRequest = new StandardCheckoutPayRequest({
            merchantOrderId: orderId,
            amount: Math.round(amount * 100), // Convert to paise
            paymentFlow: new PgCheckoutPaymentFlow({
                type: "PG_CHECKOUT",
                merchantUrls: new MerchantUrls({
                    redirectUrl: `${process.env.BASE_URL}/api/phonepe/redirect-handler`
                })
            })
        });

        console.log("[PhonePe] Pay Request object:", payRequest);

        const paymentResponse = await client.pay(payRequest);
        console.log("[PhonePe] Payment API response:", paymentResponse);

        if (!paymentResponse.success) {
            return res.status(500).json({ error: "Failed to initiate payment" });
        }

        res.json({ redirectUrl: paymentResponse.data.instrumentResponse.redirectInfo.url });
    } catch (err) {
        console.error("[PhonePe] Payment initiation error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== 2. REDIRECT HANDLER =====
router.post("/redirect-handler", async (req, res) => {
    try {
        console.log("[PhonePe] Redirect payload:", req.body);

        const { merchantOrderId } = req.body;
        if (!merchantOrderId) {
            return res.status(400).send("Missing transaction ID");
        }

        const statusResponse = await client.status(merchantOrderId);
        console.log("[PhonePe] Status response:", statusResponse);

        if (statusResponse.success && statusResponse.data.state === "COMPLETED") {
            await Booking.findByIdAndUpdate(merchantOrderId, { status: "Paid" });
            return res.send("Payment successful! Booking confirmed.");
        } else {
            await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
            return res.send("Payment failed or pending.");
        }
    } catch (error) {
        console.error("[PhonePe] Redirect handler error:", error);
        res.status(500).send("Error processing redirect");
    }
});

// ===== 3. CALLBACK / WEBHOOK =====
router.post("/phonepe-callback", async (req, res) => {
    try {
        const buf = await rawBody(req);
        const signature = req.headers["x-verify"];

        console.log("[PhonePe] Received Webhook Signature:", signature);

        const isValid = client.verifyWebhookSignature(buf, signature);
        console.log("[PhonePe] Webhook signature valid:", isValid);

        if (!isValid) {
            return res.status(400).json({ error: "Invalid signature" });
        }

        const webhookData = JSON.parse(buf.toString());
        console.log("[PhonePe] Webhook data parsed:", webhookData);

        const { merchantOrderId, state } = webhookData;
        if (!merchantOrderId) {
            return res.status(400).json({ error: "Missing order ID" });
        }

        if (state === "COMPLETED") {
            await Booking.findByIdAndUpdate(merchantOrderId, { status: "Paid" });
        } else if (state === "FAILED") {
            await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("[PhonePe] Webhook error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ===== 4. STATUS API =====
router.get("/status/:orderId", async (req, res) => {
    try {
        console.log("[PhonePe] Checking status for order:", req.params.orderId);
        const statusResponse = await client.status(req.params.orderId);
        console.log("[PhonePe] Status API raw response:", statusResponse);
        res.json(statusResponse);
    } catch (err) {
        console.error("[PhonePe] Status check error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
