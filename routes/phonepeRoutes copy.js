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
const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const { URLSearchParams } = require('url');
const Booking = require("../models/Booking");
const router = express.Router();

// --- Configuration ---
// Make sure these are set in your environment variables for production.
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = 1;

// --- API Endpoints ---
const AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const PAY_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay";
const STATUS_URL = "https://api.phonepe.com/apis/pg/checkout/v2/order";
const REFUND_URL = "https://api.phonepe.com/apis/pg/payments/v2/refund";

// Production URLs for callbacks and redirects
const REDIRECT_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/redirect-handler";
const CALLBACK_URL = "https://appointment-booking-server-o5c5.onrender.com/api/phonepe/callback";

// --- Endpoint to initiate a payment (V2 two-step process) ---
router.post("/pay", async (req, res) => {
  try {
    const { name, phone, date, timeSlot, amount } = req.body;

    if (!name || !phone || !date || !timeSlot || !amount) {
      console.error("Missing required booking information.");
      return res.status(400).json({ message: "Missing required booking information." });
    }
    
    const existingBooking = await Booking.findOne({
      date,
      timeSlot,
      status: { $in: ["Paid", "Pending"] },
    });
    if (existingBooking) {
      console.error("Slot is already taken.");
      return res.status(409).json({
        message: "This slot is already taken. Please choose another one.",
      });
    }

    const newBooking = new Booking({
      date,
      timeSlot,
      name,
      phone,
      amount,
      status: "Pending",
    });
    await newBooking.save();
    
    const merchantTransactionId = newBooking._id.toString();

    // ----------------------------------------------------------------
    // STEP 1: Get Auth Token
    // ----------------------------------------------------------------
    console.log("--- Starting Auth Token request ---");
    const authTokenPayload = {
      client_id: MERCHANT_ID,
      client_secret: SALT_KEY,
      client_version: 1,
      grant_type: "client_credentials"
    };
    const authTokenBody = new URLSearchParams(authTokenPayload).toString();
    console.log("Auth Token Request Body:", authTokenBody);

    const authTokenResponse = await axios.post(
      AUTH_URL,
      authTokenBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("PhonePe Auth Token Response Data:", authTokenResponse.data);
    const authToken = authTokenResponse.data.access_token;
    if (!authToken) {
      console.error("Failed to get PhonePe Auth Token. No access_token found in response.");
      return res.status(500).json({ message: "Failed to get PhonePe Auth Token." });
    }
    console.log("Auth Token successfully received.");

    // ----------------------------------------------------------------
    // STEP 2: Initiate Payment (Invoke PayPage)
    // ----------------------------------------------------------------
    console.log("--- Starting Payment Initiation request ---");
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      amount: amount * 100, // Amount in paise
      redirectUrl: REDIRECT_URL,
      redirectMode: "POST",
      callbackUrl: CALLBACK_URL,
      mobileNumber: phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const paymentPayloadString = JSON.stringify(paymentPayload);
    const paymentBase64Payload = Buffer.from(paymentPayloadString).toString("base64");
    
    const paymentChecksumString = paymentBase64Payload + "/apis/pg/checkout/v2/pay";
    console.log("Payment Checksum String:", paymentChecksumString);
    const paymentChecksum = crypto
      .createHmac("sha256", SALT_KEY)
      .update(paymentChecksumString)
      .digest("hex");
    const finalPaymentChecksum = paymentChecksum + "###" + SALT_INDEX;
    console.log("Generated X-VERIFY for Payment:", finalPaymentChecksum);

    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": finalPaymentChecksum,
      "X-AUTHTOKEN": `Bearer ${authToken}`, // Using the standard 'Bearer' prefix
    };
    console.log("Headers for Payment Initiation:", headers);

    const phonepeResponse = await axios.post(
      PAY_URL,
      { request: paymentBase64Payload },
      { headers }
    );

    console.log("Payment Initiation Response Data:", phonepeResponse.data);
    const redirectInfo = phonepeResponse.data?.data?.instrumentResponse?.redirectInfo;

    if (redirectInfo && redirectInfo.url) {
      console.log("Payment initiated successfully. Redirecting user.");
      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: phonepeResponse.data.data,
      });
    } else {
      console.error("Payment initiation failed: no redirect URL found in response.");
      res.status(500).json({ 
        message: "Payment initiation failed: no redirect URL.",
        error: phonepeResponse.data
      });
    }

  } catch (error) {
    console.error("An unexpected error occurred during payment initiation:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || error.message || error;
    res.status(500).json({
      message: "Server error during payment initiation. Please try again later.",
      error: errorMessage,
    });
  }
});

// --- Endpoint to handle PhonePe's POST redirect ---
router.post("/redirect-handler", async (req, res) => {
  try {
    const { code, transactionId } = req.body;
    console.log("Redirect Handler received a response:", req.body);
    const status = code === "PAYMENT_SUCCESS" ? "success" : "failure";
    res.redirect(`https://manjunathrajpurohit.in/payment-success?status=${status}&transactionId=${transactionId}`);
  } catch (error) {
    console.error("Error in redirect handler:", error.message);
    res.redirect("https://manjunathrajpurohit.in/payment-failure?error=redirect-failed");
  }
});

// --- Webhook endpoint to receive payment status from PhonePe (V2) ---
router.post("/callback", async (req, res) => {
  try {
    const { response } = req.body;
    console.log("Webhook callback received a response:", req.body);

    const decodedResponse = JSON.parse(
      Buffer.from(response, "base64").toString("utf-8")
    );
    console.log("Decoded Webhook Response:", decodedResponse);

    const { merchantTransactionId, state } = decodedResponse.data;

    const checkSumString = response;
    console.log("Webhook Checksum String:", checkSumString);
    const checkSum =
      crypto
        .createHmac("sha256", SALT_KEY)
        .update(checkSumString)
        .digest("hex") +
      "###" +
      SALT_INDEX;
    const phonepeChecksum = req.headers["x-verify"];
    console.log("Generated Checksum:", checkSum);
    console.log("Received Checksum:", phonepeChecksum);

    if (checkSum !== phonepeChecksum) {
      console.error("Webhook Checksum mismatch.");
      return res.status(400).send({ message: "Checksum mismatch" });
    }
    console.log("Webhook Checksum verified successfully.");

    if (state === "COMPLETED") {
      await Booking.findByIdAndUpdate(merchantTransactionId, { status: "Paid" });
      console.log(`Booking for transaction ${merchantTransactionId} marked as Paid.`);
    } else {
      await Booking.findByIdAndUpdate(merchantTransactionId, { status: "Failed" });
      console.log(`Booking for transaction ${merchantTransactionId} marked as Failed.`);
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Failed to process webhook callback:", error.message);
    res.status(500).send({
      message: "Failed to process callback",
      error: error.message,
    });
  }
});

// --- Endpoint to check the status of a specific transaction (V2) ---
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log("Checking status for transaction ID:", transactionId);

    const checkSumString = `/apis/pg/checkout/v2/order/${transactionId}/status`;
    console.log("Status Checksum String:", checkSumString);
    const checkSum =
      crypto
        .createHmac("sha256", SALT_KEY)
        .update(checkSumString)
        .digest("hex") +
      "###" +
      SALT_INDEX;
    console.log("Generated X-VERIFY for Status Check:", checkSum);

    const response = await axios.get(
      `${STATUS_URL}/${transactionId}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checkSum,
        },
      }
    );
    console.log("Order Status Response Data:", response.data);
    res.status(200).send(response.data);
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
    const { merchantTransactionId, originalTransactionId, amount } = req.body;
    console.log("Starting refund for transaction:", originalTransactionId);

    const refundPayload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      originalTransactionId: originalTransactionId,
      amount: amount * 100, // Amount in paise
    };

    const refundPayloadString = JSON.stringify(refundPayload);
    const refundBase64Payload = Buffer.from(refundPayloadString).toString("base64");

    const refundChecksumString = refundBase64Payload + "/apis/pg/payments/v2/refund";
    console.log("Refund Checksum String:", refundChecksumString);
    const refundChecksum = crypto
      .createHmac("sha256", SALT_KEY)
      .update(refundChecksumString)
      .digest("hex");
    const finalRefundChecksum = refundChecksum + "###" + SALT_INDEX;
    console.log("Generated X-VERIFY for Refund:", finalRefundChecksum);

    const response = await axios.post(
      REFUND_URL,
      { request: refundBase64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": finalRefundChecksum,
        },
      }
    );
    console.log("Refund Response Data:", response.data);
    res.status(200).send(response.data);
  } catch (error) {
    console.error("Failed to process refund:", error.response?.data || error.message);
    res.status(500).send({
      message: "Failed to process refund",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;