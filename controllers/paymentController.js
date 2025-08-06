// import crypto from "crypto";
// import axios from "axios";
// import Booking from "../models/Booking.js";

// export const initiatePayment = async (req, res) => {
//   try {
//     const { name, phone, date, timeSlot, amount } = req.body;

//     const transactionId = `T${Date.now()}`;
//     const payload = {
//       merchantId: process.env.PHONEPE_MERCHANT_ID,
//       transactionId,
//       merchantUserId: phone,
//       amount: amount * 100,
//       redirectUrl: `${process.env.REDIRECT_CALLBACK_URL}?transactionId=${transactionId}`,
//       redirectMode: "POST",
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
//     const stringToSign = payloadBase64 + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
//     const checksum =
//       crypto.createHash("sha256").update(stringToSign).digest("hex") +
//       "###" +
//       process.env.PHONEPE_SALT_INDEX;

//     const phonePeResponse = await axios.post(
//       process.env.PHONEPE_BASE_URL,
//       { request: payloadBase64 },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": checksum,
//         },
//       }
//     );

//     await Booking.create({
//       name,
//       phone,
//       date,
//       timeSlot,
//       amount,
//       paymentStatus: "PENDING",
//       transactionId,
//     });

//     res.json({
//       redirectUrl: phonePeResponse.data.data.instrumentResponse.redirectInfo.url,
//     });
//   } catch (err) {
//     console.error("Payment initiation error:", err);
//     res.status(500).json({ message: "Failed to initiate payment." });
//   }
// };

// export const paymentCallback = async (req, res) => {
//   try {
//     const { transactionId } = req.query;
//     const statusUrl = `${process.env.PHONEPE_STATUS_BASE}/${process.env.PHONEPE_MERCHANT_ID}/${transactionId}`;

//     const stringToSign =
//       `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${transactionId}` +
//       process.env.PHONEPE_SALT_KEY;

//     const checksum =
//       crypto.createHash("sha256").update(stringToSign).digest("hex") +
//       "###" +
//       process.env.PHONEPE_SALT_INDEX;

//     const statusResponse = await axios.get(statusUrl, {
//       headers: {
//         "Content-Type": "application/json",
//         "X-VERIFY": checksum,
//       },
//     });

//     const status = statusResponse.data.data.transactionStatus;

//     if (status === "SUCCESS") {
//       await Booking.findOneAndUpdate(
//         { transactionId },
//         { $set: { paymentStatus: "PAID" } }
//       );
//       return res.redirect(process.env.FRONTEND_SUCCESS_URL);
//     } else {
//       await Booking.findOneAndUpdate(
//         { transactionId },
//         { $set: { paymentStatus: "FAILED" } }
//       );
//       return res.redirect(process.env.FRONTEND_FAILURE_URL);
//     }
//   } catch (err) {
//     console.error("Callback error:", err);
//     res.redirect(process.env.FRONTEND_FAILURE_URL);
//   }
// };
