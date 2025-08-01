const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs
const { createBookingRecord } = require("../controllers/bookingController"); // Import the internal function

// Environment variables for PhonePe
const PHONEPE_HOST_UAT = process.env.PHONEPE_UAT_HOST_URL || "https://api.phonepe.com/apis/hermes"; // Sandbox or Production
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;

// Helper to generate X-VERIFY checksum
// const generateXVerify = (payload, saltKey, saltIndex) => {
//   const data = Buffer.from(JSON.stringify(payload)).toString("base64");
//   const string = data + "/pg/v1/pay" + saltKey;
//   const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//   return sha256 + "###" + saltIndex;
// };

const generateXVerify = (payload, saltKey, saltIndex) => {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");
    const string = data + "/pg/v1/pay" + saltKey; // Ensure "/pg/v1/pay" is exact
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + saltIndex;
};

// Helper to generate X-VERIFY for status check/callback
const generateXVerifyStatus = (body, url, saltKey, saltIndex) => {
  const string = body + url + saltKey;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  return sha256 + "###" + saltIndex;
};

// Helper function to format 12-hour time (can be moved to a shared utility)
const format12Hour = (timeStr) => {
  const [hour, minute] = timeStr.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
};

// @route POST /api/payments/initiate
// @desc Initiate PhonePe payment
router.post("/initiate", async (req, res) => {
    const { name, phone, email, date, timeSlot } = req.body;

    if (!name || !phone || !email || !date || !timeSlot) {
        return res.status(400).json({ message: "Missing required booking details." });
    }

    const merchantTransactionId = uuidv4();
    const amountInPaise = 10000; // 100 INR

    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        amount: amountInPaise,
        redirectUrl: `${process.env.PHONEPE_REDIRECT_URL}`, // Ensure this is just the base redirect URL
        redirectMode: "POST",
        callbackUrl: `${process.env.PHONEPE_CALLBACK_URL}`, // Ensure this is just the base callback URL
        mobileNumber: phone,
        paymentInstrument: {
            type: "PAY_PAGE",
        },
  };

  const xVerify = generateXVerify(payload, SALT_KEY, SALT_INDEX);
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

   // --- ADD THESE LOGS ---
    console.log("\n--- PhonePe Payment Initiation Debug ---");
    console.log("APP_ENV:", process.env.APP_ENV);
    console.log("PHONEPE_HOST_UAT:", PHONEPE_HOST_UAT);
    console.log("MERCHANT_ID:", MERCHANT_ID);
    console.log("SALT_KEY (first 5 chars):", SALT_KEY ? SALT_KEY.substring(0, 5) + '...' : 'NOT SET'); // To avoid logging full key
    console.log("SALT_INDEX:", SALT_INDEX);
    console.log("Generated merchantTransactionId:", merchantTransactionId);
    console.log("Original Payload (JSON):", JSON.stringify(payload, null, 2));
    console.log("Base64 Encoded Payload:", base64Payload);
    console.log("Checksum String Part 1 (Base64+Endpoint+SaltKey):", base64Payload + "/pg/v1/pay" + SALT_KEY);
    console.log("Calculated X-VERIFY:", xVerify);
    console.log("Target PhonePe API URL:", `${PHONEPE_HOST_UAT}/pg/v1/pay`);
    console.log("--- End Debug ---");

  try {
    const response = await axios.post(
      `${PHONEPE_HOST_UAT}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          accept: "application/json",
        },
      }
    );
  if (response.data.success && response.data.data.instrumentResponse.redirectInfo.url) {
            console.log("PhonePe initiation successful. Redirect URL:", response.data.data.instrumentResponse.redirectInfo.url);
            return res.status(200).json({
                success: true,
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
                merchantTransactionId: merchantTransactionId,
                bookingDetails: { name, phone, email, date, timeSlot }
            });
        } else {
            console.error("PhonePe initiation failed with response:", response.data);
            return res.status(500).json({
                success: false,
                message: response.data.message || "PhonePe initiation failed.",
            });
        }
    } catch (error) {
        console.error("Error initiating PhonePe payment:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Error initiating payment. Please try again.",
            error: error.response?.data || error.message,
        });
  }
});

// @route POST /api/payments/callback
// @desc PhonePe payment callback/webhook
router.post("/callback", async (req, res) => {
  const { response } = req.body;
  const xVerifyHeader = req.headers["x-verify"];

  if (!response || !xVerifyHeader) {
    return res.status(400).send("Bad Request: Missing data or X-Verify header.");
  }

  // Verify the checksum
  const expectedXVerify = generateXVerifyStatus(response, "/pg/v1/callback", SALT_KEY, SALT_INDEX);
  if (xVerifyHeader !== expectedXVerify) {
    console.error("PhonePe callback: X-Verify mismatch. Possible tampering.");
    return res.status(401).send("Unauthorized: Invalid X-Verify checksum.");
  }

  const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString("utf8"));

  const { code, data } = decodedResponse;
  const { merchantId, transactionId, merchantTransactionId, amount, state } = data;

  if (state === "COMPLETED" && code === "PAYMENT_SUCCESS") {
    console.log(`Payment successful for merchantTransactionId: ${merchantTransactionId}`);
    console.log("Full decoded response:", decodedResponse);

    // Fetch the original booking details associated with this merchantTransactionId
    // In a real application, you'd fetch this from a 'PendingPayments' collection
    // For this example, we'll assume the client sent the details and they were valid.
    // If you don't store pending bookings, you might need to query PhonePe's status API here.

    // THIS IS A CRITICAL PART: You must store the booking details received during initiation
    // or query them from your own system/PhonePe to create the booking.
    // For simplicity, let's assume `createBookingRecord` handles finding or creating
    // based on `merchantTransactionId`. In a real app, `createBookingRecord` would need
    // to receive the full booking details (name, phone, email, date, timeSlot)
    // from a temporary storage or by querying your system based on merchantTransactionId.

    // For demonstration, let's assume we can retrieve the details or they are passed securely.
    // In a production app, you'd fetch this from your database using `merchantTransactionId`.
    // Example: const tempBooking = await TempBookings.findOne({ merchantTransactionId });
    // if (!tempBooking) { /* handle error */ }

    // Dummy data for `createBookingRecord` if you don't have a PendingPayments collection
    // You would replace this with actual data retrieved from your pending bookings storage
    const tempBookingDetails = { // This needs to come from your DB, not hardcoded!
      date: "2025-08-01", // Placeholder: replace with actual date
      timeSlot: "10:30", // Placeholder: replace with actual timeSlot
      name: "John Doe",   // Placeholder: replace with actual name
      phone: "9876543210", // Placeholder: replace with actual phone
      email: "john.doe@example.com" // Placeholder: replace with actual email
    };

    // To make this robust, you MUST store the `name`, `phone`, `email`, `date`, `timeSlot`
    // in your backend when the `/initiate` endpoint is called, linked by `merchantTransactionId`.
    // Then, in this callback, you retrieve those details using `merchantTransactionId`.
    // For now, let's pass dummy details for `createBookingRecord` and assume it handles idempotency.
    // For the purpose of this example, I'll pass the dummy data, but you NEED to replace it.
    // A better approach would be:
    // 1. Create a `PendingBooking` model with all user details + `merchantTransactionId`.
    // 2. Save it in `/initiate` with `paymentStatus: PENDING`.
    // 3. In `/callback`, find `PendingBooking` by `merchantTransactionId`, update its `paymentStatus` to `SUCCESS`,
    //    and then transfer data to the `Booking` model or just use the `PendingBooking` as the final record.

    // To simplify and demonstrate, let's modify createBookingRecord to handle upsert/update if needed
    // based on `merchantTransactionId`.

    // In a real scenario:
    // 1. You initiate payment with `merchantTransactionId`.
    // 2. You store `name, phone, email, date, timeSlot, merchantTransactionId, paymentStatus: 'PENDING'` in a `Bookings` or `PendingPayments` collection.
    // 3. In this callback, you find that record by `merchantTransactionId`.
    // 4. If found and `state === "COMPLETED"`, update its `paymentStatus` to `SUCCESS`.
    //    If it's a dedicated `PendingPayments` collection, you move the data to `Bookings` and delete from `PendingPayments`.
    //    Then, send WhatsApp messages.

    // Let's assume `createBookingRecord` is now smart enough to find or create.
    const bookingResult = await createBookingRecord({
      ...tempBookingDetails, // This should come from your DB!
      phonePeTransactionId: transactionId, // PhonePe's transaction ID
      merchantTransactionId: merchantTransactionId, // Your original transaction ID
      paymentStatus: "SUCCESS", // Explicitly setting success
    });

    if (bookingResult.success) {
      res.status(200).send({ success: true, message: "Payment and booking confirmed." });
    } else {
      console.error("Error during booking record creation in callback:", bookingResult.message);
      res.status(500).send({ success: false, message: "Payment received, but booking failed." });
    }
  } else {
    // Payment failed or was pending/cancelled
    console.warn(`Payment status: ${state}, Code: ${code} for merchantTransactionId: ${merchantTransactionId}`);
    // You might want to update the `paymentStatus` to FAILED in your database here
    res.status(200).send({ success: true, message: "Payment not completed or failed." }); // PhonePe expects a 200 OK
  }
});

// @route GET /api/payments/status/:merchantTransactionId
// @desc Check PhonePe payment status (optional, for reconciliation)
router.get("/status/:merchantTransactionId", async (req, res) => {
  const { merchantTransactionId } = req.params;

  const url = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
  const xVerify = generateXVerifyStatus(
    "", // No request body for GET status check
    url,
    SALT_KEY,
    SALT_INDEX
  );

  try {
    const response = await axios.get(`${PHONEPE_HOST_UAT}${url}`, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": MERCHANT_ID,
        accept: "application/json",
      },
    });

    if (response.data.success && response.data.code === "PAYMENT_SUCCESS") {
      res.status(200).json({
        success: true,
        status: response.data.data.state, // COMPLETED
        transactionId: response.data.data.transactionId, // PhonePe's transaction ID
        message: "Payment successful.",
      });
    } else {
      res.status(200).json({
        success: false,
        status: response.data.data.state, // FAILED, PENDING, etc.
        message: response.data.message || "Payment not successful or still pending.",
      });
    }
  } catch (error) {
    console.error("Error checking PhonePe payment status:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Error checking payment status.",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;