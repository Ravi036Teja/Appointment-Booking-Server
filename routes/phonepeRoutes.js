// // const express = require("express");
// // const crypto = require("crypto");
// // const axios = require("axios");
// // const Booking = require("../models/Booking");
// // const router = express.Router();

// // const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// // const SALT_KEY = process.env.PHONEPE_SALT_KEY;
// // const SALT_INDEX = 1;
// // const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

// // // Use your Render domain for callbacks and redirects for production
// // // For local testing, use a tool like ngrok to expose your localhost to the internet.
// // const REDIRECT_URL = "http://localhost:5000/api/phonepe/redirect-handler";
// // const CALLBACK_URL = "https://033fe6ad0cbb.ngrok-free.app/api/phonepe/callback";

// // router.post("/pay", async (req, res) => {
// //   try {
// //     const { name, phone, date, timeSlot, amount } = req.body;

// //     // This is the key validation check. It expects the data from your frontend.
// //     if (!name || !phone || !date || !timeSlot || !amount) {
// //       console.log("Validation failed: Missing required booking information.", {
// //         name,
// //         phone,
// //         date,
// //         timeSlot,
// //         amount,
// //       });
// //       return res
// //         .status(400)
// //         .json({ message: "Missing required booking information." });
// //     }

// //     // Check if the slot is already taken
// //     const existingBooking = await Booking.findOne({
// //       date,
// //       timeSlot,
// //       status: { $in: ["Paid", "Pending"] },
// //     });
// //     if (existingBooking) {
// //       return res.status(409).json({
// //         message: "This slot is already taken. Please choose another one.",
// //       });
// //     }

// //     // Create a new booking in 'Pending' status
// //     const newBooking = new Booking({
// //       date,
// //       timeSlot,
// //       name,
// //       phone,
// //       amount,
// //       status: "Pending",
// //     });
// //     await newBooking.save();

// //     // The transaction ID will be the booking's MongoDB ID
// //     const merchantTransactionId = newBooking._id.toString();

// //     const paymentPayload = {
// //       merchantId: MERCHANT_ID,
// //       merchantTransactionId: merchantTransactionId,
// //       amount: amount * 100, // Amount in paise
// //       redirectUrl: REDIRECT_URL,
// //       redirectMode: "GET",
// //       callbackUrl: CALLBACK_URL,
// //       mobileNumber: phone,
// //       paymentInstrument: {
// //         type: "PAY_PAGE",
// //       },
// //     };

// //     const payloadString = JSON.stringify(paymentPayload);
// //     const base64Payload = Buffer.from(payloadString).toString("base64");
// //     const checksum = crypto
// //       .createHash("sha256")
// //       .update(base64Payload + "/pg/v1/pay" + SALT_KEY)
// //       .digest("hex");
// //     const finalChecksum = checksum + "###" + SALT_INDEX;

// //     const headers = {
// //       "Content-Type": "application/json",
// //       "X-VERIFY": finalChecksum,
// //     };

// //     const phonepeResponse = await axios.post(
// //       `${PHONEPE_HOST_URL}/pg/v1/pay`,
// //       {
// //         request: base64Payload,
// //       },
// //       { headers: { ...headers, "Content-Type": "application/json" } }
// //     );

// //     const redirectInfo =
// //       phonepeResponse.data?.data?.instrumentResponse?.redirectInfo;

// //     if (redirectInfo && redirectInfo.url) {
// //       console.log("Payment initiated successfully:", merchantTransactionId);
// //       res.status(200).json({
// //         success: true,
// //         message: "Payment initiated successfully",
// //         data: phonepeResponse.data.data,
// //       });
// //     } else {
// //       console.error(
// //         "PhonePe API did not return a redirect URL:",
// //         phonepeResponse.data
// //       );
// //       res
// //         .status(500)
// //         .json({ message: "Payment initiation failed: no redirect URL." });
// //     }
// //   } catch (error) {
// //     console.error(
// //       "Error during PhonePe payment initiation:",
// //       error.response?.data || error.message
// //     );
// //     res.status(500).json({
// //       message:
// //         "Server error during payment initiation. Please try again later.",
// //     });
// //   }
// // });

// // router.post("/redirect-handler", async (req, res) => {
// //   try {
// //     // Extract data from PhonePe's POST request
// //     const { code, transactionId } = req.body;
// //     const status = code === "PAYMENT_SUCCESS" ? "success" : "failure";

// //     // Perform a GET redirect to your frontend URL
// //     res.redirect(
// //       `http://localhost:5173/payment-success?status=${status}&transactionId=${transactionId}`
// //     );
// //   } catch (error) {
// //     console.error("Redirect handler error:", error);
// //     // If something goes wrong, redirect to a failure page
// //     res.redirect("http://localhost:5173/payment-failure?error=redirect-failed");
// //   }
// // });

// // // Webhook endpoint to receive payment status from PhonePe
// // router.post("/callback", async (req, res) => {
// //   console.log("PhonePe callback received!"); // Add this line
// //   try {
// //     const { response } = req.body;
// //     const decodedResponse = JSON.parse(
// //       Buffer.from(response, "base64").toString("utf-8")
// //     );
// //     const { merchantTransactionId, code, state } = decodedResponse.data;

// //     console.log(
// //       `Callback received for transaction ID: ${merchantTransactionId}, Status: ${state}`
// //     );
// //     console.log(`Callback status received: ${state}`); // Add this line
// //     // IMPORTANT: Verify checksum to ensure the request is from PhonePe
// //     const checkSum =
// //       crypto
// //         .createHash("sha256")
// //         .update(response + SALT_KEY)
// //         .digest("hex") +
// //       "###" +
// //       SALT_INDEX;
// //     const phonepeChecksum = req.headers["x-verify"];

// //     if (checkSum !== phonepeChecksum) {
// //       return res.status(400).send({ message: "Checksum mismatch" });
// //     }

// //     // Now, you can update your database based on the 'state'
// //     // Possible states: 'COMPLETED', 'FAILED', 'PENDING'
// //     if (state === "COMPLETED") {
// //       // Find the document and log the result of the update
// //       const updatedBooking = await Booking.findByIdAndUpdate(
// //         merchantTransactionId,
// //         { status: "Paid" },
// //         { new: true } // The 'new: true' option returns the updated document
// //       );

// //       if (updatedBooking) {
// //         console.log(
// //           `Transaction ${merchantTransactionId} completed successfully. Database updated.`
// //         );
// //         console.log("Updated booking document:", updatedBooking);
// //       } else {
// //         console.error(
// //           `Error: Booking with ID ${merchantTransactionId} not found in the database.`
// //         );
// //       }
// //     } else {
// //       // Handle other states (e.g., FAILED)
// //       await Booking.findByIdAndUpdate(merchantTransactionId, {
// //         status: "Failed",
// //       });
// //       console.log(
// //         `Transaction ${merchantTransactionId} failed. Database updated to Failed.`
// //       );
// //     }

// //     res.status(200).send("OK");
// //   } catch (error) {
// //     console.error("Callback processing error:", error);
// //     res.status(500).send({
// //       message: "Failed to process callback",
// //       error: error.message,
// //     });
// //   }
// // });

// // // Endpoint for frontend to check the status of a specific transaction (optional, but good practice)
// // router.get("/status/:transactionId", async (req, res) => {
// //   try {
// //     const { transactionId } = req.params;
// //     const checkSum =
// //       crypto
// //         .createHash("sha256")
// //         .update(
// //           `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}` +
// //             PHONEPE_SALT_KEY
// //         )
// //         .digest("hex") +
// //       "###" +
// //       PHONEPE_SALT_INDEX;

// //     const response = await axios.get(
// //       `${PHONEPE_STATUS_URL}/${PHONEPE_MERCHANT_ID}/${transactionId}`,
// //       {
// //         headers: {
// //           "Content-Type": "application/json",
// //           "X-VERIFY": checkSum,
// //           "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
// //         },
// //       }
// //     );

// //     res.status(200).send(response.data);
// //   } catch (error) {
// //     console.error("Status check error:", error);
// //     res.status(500).send({
// //       message: "Failed to get payment status",
// //       error: error.message,
// //     });
// //   }
// // });

// // module.exports = router;

// const express = require("express");
// const crypto = require("crypto");
// const axios = require("axios");
// const Booking = require("../models/Booking");
// const router = express.Router();

// // TODO: Replace with your LIVE production credentials from the PhonePe dashboard
// const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const SALT_KEY = process.env.PHONEPE_SALT_KEY;
// const SALT_INDEX = 1;
// const PHONEPE_HOST_URL = "https://api.phonepe.com/apis/hermes/pg/v1";

// // Production URLs for callbacks and redirects
// // Must be publicly accessible and use HTTPS
// const REDIRECT_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/redirect-handler";
// const CALLBACK_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/callback";

// // Endpoint to initiate a payment
// router.post("/pay", async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, amount } = req.body;

//     if (!name || !phone || !date || !timeSlot || !amount) {
//       return res
//         .status(400)
//         .json({ message: "Missing required booking information." });
//     }

//     const existingBooking = await Booking.findOne({
//       date,
//       timeSlot,
//       status: { $in: ["Paid", "Pending"] },
//     });
//     if (existingBooking) {
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

//     const merchantTransactionId = newBooking._id.toString();

//     const paymentPayload = {
//       merchantId: MERCHANT_ID,
//       merchantTransactionId: merchantTransactionId,
//       amount: amount * 100,
//       redirectUrl: REDIRECT_URL,
//       redirectMode: "POST",
//       callbackUrl: CALLBACK_URL,
//       mobileNumber: phone,
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     const payloadString = JSON.stringify(paymentPayload);
//     const base64Payload = Buffer.from(payloadString).toString("base64");

//     const checksum = crypto
//       .createHash("sha256")
//       .update(base64Payload + "/pg/v1/pay" + SALT_KEY)
//       .digest("hex");
//     const finalChecksum = checksum + "###" + SALT_INDEX;

//     // Log the checksum being sent
//     console.log("Generated Checksum:", finalChecksum);

//     const phonepeResponse = await axios.post(
//       `${PHONEPE_HOST_URL}/pay`,
//       {
//         request: base64Payload,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": finalChecksum,
//         },
//       }
//     );

//     const redirectInfo =
//       phonepeResponse.data?.data?.instrumentResponse?.redirectInfo;

//     if (redirectInfo && redirectInfo.url) {
//       res.status(200).json({
//         success: true,
//         message: "Payment initiated successfully",
//         data: phonepeResponse.data.data,
//       });
//     } else {
//       res
//         .status(500)
//         .json({ message: "Payment initiation failed: no redirect URL." });
//     }
//   } catch (error) {
//     // THIS IS THE CRITICAL CHANGE: Log the entire error object
//     console.error("An unexpected error occurred during payment initiation:", error);

//     const errorMessage = error.response?.data || error.message || error;
//     res.status(500).json({
//       message:
//         "Server error during payment initiation. Please try again later.",
//       error: errorMessage,
//     });
//   }
// });

// // Endpoint to handle PhonePe's POST redirect
// router.post("/redirect-handler", async (req, res) => {
//   try {
//     const { code, transactionId } = req.body;
//     const status = code === "PAYMENT_SUCCESS" ? "success" : "failure";

//     res.redirect(
//       `https://manjunathrajpurohit.in/payment-success?status=${status}&transactionId=${transactionId}`
//     );
//   } catch (error) {
//     res.redirect("https://manjunathrajpurohit.in/payment-failure?error=redirect-failed");
//   }
// });

// // Webhook endpoint to receive payment status from PhonePe
// router.post("/callback", async (req, res) => {
//   try {
//     const { response } = req.body;
//     const decodedResponse = JSON.parse(
//       Buffer.from(response, "base64").toString("utf-8")
//     );
//     const { merchantTransactionId, state } = decodedResponse.data;

//     // IMPORTANT: Verify checksum to ensure the request is from PhonePe
//     const checkSum =
//       crypto
//         .createHash("sha256")
//         .update(response + SALT_KEY)
//         .digest("hex") +
//       "###" +
//       SALT_INDEX;
//     const phonepeChecksum = req.headers["x-verify"];

//     if (checkSum !== phonepeChecksum) {
//       return res.status(400).send({ message: "Checksum mismatch" });
//     }

//     if (state === "COMPLETED") {
//       await Booking.findByIdAndUpdate(merchantTransactionId, { status: "Paid" });
//     } else {
//       await Booking.findByIdAndUpdate(merchantTransactionId, { status: "Failed" });
//     }

//     res.status(200).send("OK");
//   } catch (error) {
//     res.status(500).send({
//       message: "Failed to process callback",
//       error: error.message,
//     });
//   }
// });

// // Endpoint to check the status of a specific transaction
// router.get("/status/:transactionId", async (req, res) => {
//   try {
//     const { transactionId } = req.params;

//     // Checksum calculation for the status API
//     const checkSum =
//       crypto
//         .createHash("sha256")
//         .update(`/pg/v1/status/${MERCHANT_ID}/${transactionId}${SALT_KEY}`)
//         .digest("hex") +
//       "###" +
//       SALT_INDEX;

//     const response = await axios.get(
//       `${PHONEPE_HOST_URL}/status/${MERCHANT_ID}/${transactionId}`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": checkSum,
//           "X-MERCHANT-ID": MERCHANT_ID,
//         },
//       }
//     );

//     res.status(200).send(response.data);
//   } catch (error) {
//     res.status(500).send({
//       message: "Failed to get payment status",
//       error: error.response?.data || error.message,
//     });
//   }
// });

// module.exports = router;

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


const express = require("express");
const crypto = require("crypto");
const { randomUUID } = require('crypto');
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, RefundRequest } = require('pg-sdk-node');
const Booking = require("../models/Booking");
const router = express.Router();

// --- Configuration ---
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY;
const CLIENT_VERSION = 1;
const ENV = Env.PRODUCTION; // Change to Env.PRODUCTION for live environment

const client = StandardCheckoutClient.getInstance(MERCHANT_ID, CLIENT_SECRET, CLIENT_VERSION, ENV);

// Production URLs for callbacks and redirects.
// NOTE: Use your actual production domain, not the Render URL, for the client-side redirect.
const REDIRECT_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/redirect-handler";
const CALLBACK_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/callback";

// --- Endpoint to initiate a payment ---
router.post("/pay", async (req, res) => {
    try {
        const { name, phone, date, timeSlot, amount } = req.body;

        if (!name || !phone || !date || !timeSlot || !amount) {
            return res.status(400).json({ message: "Missing required booking information." });
        }
        
        // 1. Check for existing booking (pending or paid) to prevent duplicate transactions
        const existingBooking = await Booking.findOne({
            date,
            timeSlot,
            status: { $in: ["Paid", "Pending"] },
        });
        if (existingBooking) {
            return res.status(409).json({ message: "This slot is already taken. Please choose another one." });
        }

        // 2. Create a new booking with 'Pending' status.
        // The ID of this booking will be our merchantOrderId.
        const newBooking = new Booking({
            date,
            timeSlot,
            name,
            phone,
            amount,
            status: "Pending",
        });
        await newBooking.save();
        
        const merchantOrderId = newBooking._id.toString();

        // 3. Initiate payment via PhonePe SDK
        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amount * 100)
            .redirectUrl(REDIRECT_URL)
            .build();

        const response = await client.pay(payRequest);

        if (response && response.redirectUrl) {
            res.status(200).json({
                success: true,
                message: "Payment initiated successfully",
                redirectUrl: response.redirectUrl,
            });
        } else {
            console.error("Payment initiation failed: no redirect URL found in response.");
            // If payment fails to initiate, mark the booking as failed and inform the user.
            await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
            res.status(500).json({ 
                message: "Payment initiation failed: no redirect URL.",
                error: response
            });
        }

    } catch (error) {
        console.error("An unexpected error occurred during payment initiation:", error.response?.data || error.message);
        res.status(500).json({
            message: "Server error during payment initiation. Please try again later.",
            error: error.response?.data?.message || error.message || error,
        });
    }
});

// --- Endpoint to handle PhonePe's redirect after payment ---
// This endpoint is for user experience. The definitive status comes from the callback.
router.get("/redirect-handler", async (req, res) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      console.error("No transactionId found in redirect handler.");
      return res.redirect("https://manjunathrajpurohit.in/payment-failure?error=no-transaction-id");
    }

    // Get the final status directly from PhonePe's API for the best user experience.
    const response = await client.getOrderStatus(transactionId);
    const transactionState = response.payload.state;
    
    const status = transactionState === "COMPLETED" ? "success" : "failure";

    // Redirect to the frontend with the final status.
    res.redirect(`https://manjunathrajpurohit.in/payment-result?status=${status}&transactionId=${transactionId}`);
  } catch (error) {
    console.error("Error in redirect handler during status check:", error.message);
    res.redirect("https://manjunathrajpurohit.in/payment-failure?error=redirect-failed");
  }
});


// --- Webhook endpoint to receive payment status from PhonePe (POST request) ---
// THIS IS THE MOST RELIABLE SOURCE OF TRUTH.
router.post("/callback", async (req, res) => {
  try {
    const callbackResponse = client.validateCallback(req.headers.authorization, req.body);

    if (!callbackResponse || callbackResponse.payload.state === 'FAILED') {
      console.error("Webhook validation failed or payment failed.");
      return res.status(400).send({ message: "Invalid callback or failed payment" });
    }
    
    const { merchantOrderId, state } = callbackResponse.payload;

    if (state === "COMPLETED") {
      // Update the booking to "Paid" if the state is completed
      await Booking.findByIdAndUpdate(merchantOrderId, { status: "Paid" });
      // Send confirmation message to the user here
      // Find the booking to get the user's details for the message
      const confirmedBooking = await Booking.findById(merchantOrderId);
      if (confirmedBooking) {
          try {
              // Assuming your WhatsApp sender function is correct
              const message = `🙏 Hi ${confirmedBooking.name}, your appointment for ${dayjs(confirmedBooking.date).format("YYYY-MM-DD")} at ${confirmedBooking.timeSlot} is now confirmed.`;
              await sendWhatsAppMessage(confirmedBooking.phone, message);
              console.log("WhatsApp message sent successfully for booking:", merchantOrderId);
          } catch (whatsappErr) {
              console.error("Failed to send WhatsApp message:", whatsappErr);
          }
      }
      console.log(`Booking for transaction ${merchantOrderId} marked as Paid.`);
    } else {
      // Update the booking to "Failed" for other states
      await Booking.findByIdAndUpdate(merchantOrderId, { status: "Failed" });
      console.log(`Booking for transaction ${merchantOrderId} marked as Failed.`);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Failed to process webhook callback:", error.message);
    res.status(500).send({ message: "Failed to process callback", error: error.message });
  }
});

// The rest of your router code (status, refund) remains the same and is correct.
// --- Endpoint to check the status of a specific transaction ---
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log("Checking status for transaction ID:", transactionId);

    const response = await client.getOrderStatus(transactionId);
    console.log("Order Status Response Data:", response);
    res.status(200).send(response);
  } catch (error) {
    console.error("Failed to get payment status:", error.response?.data || error.message);
    res.status(500).send({
      message: "Failed to get payment status",
      error: error.response?.data || error.message,
    });
  }
});

// --- Endpoint for Refund API ---
router.post("/refund", async (req, res) => {
  try {
    const { originalMerchantOrderId, amount } = req.body;
    const merchantRefundId = randomUUID();
    console.log("Starting refund for transaction:", originalMerchantOrderId);

    const refundRequest = RefundRequest.builder()
        .amount(amount * 100) // Amount in paise
        .merchantRefundId(merchantRefundId)
        .originalMerchantOrderId(originalMerchantOrderId)
        .build();

    const response = await client.refund(refundRequest);
    console.log("Refund Response Data:", response);
    res.status(200).send(response);
  } catch (error) {
    console.error("Failed to process refund:", error.response?.data || error.message);
    res.status(500).send({
      message: "Failed to process refund",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;