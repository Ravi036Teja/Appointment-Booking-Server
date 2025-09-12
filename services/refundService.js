// services/refundService.js

const { StandardCheckoutClient, StandardCheckoutRefundRequest, Env } = require("pg-sdk-node");
const { randomUUID } = require("crypto");
const Booking = require("../models/Booking");

const {
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  PHONEPE_CLIENT_VERSION,
  ENV,
} = process.env;

// Initialize PhonePe client
const client = StandardCheckoutClient.getInstance(
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  parseInt(PHONEPE_CLIENT_VERSION),
  ENV === "PROD" ? Env.PRODUCTION : Env.SANDBOX
);

const initiateRefund = async (merchantOrderId) => {
  try {
    const booking = await Booking.findOne({ merchantOrderId });

    if (!booking) {
      console.error(`Refund failed: Booking with merchantOrderId ${merchantOrderId} not found.`);
      return { success: false, message: "Booking not found." };
    }

    if (booking.status !== "Paid" || booking.refundStatus !== "Not Refunded") {
      console.warn(`Refund not required for booking ${merchantOrderId}. Status: ${booking.status}, RefundStatus: ${booking.refundStatus}`);
      return { success: false, message: "Booking is not in a refundable state." };
    }

    const refundRequest = StandardCheckoutRefundRequest.builder()
      .merchantRefundId(randomUUID())
      .originalMerchantOrderId(merchantOrderId)
      .amount(booking.amount * 100)
      .build();

    const refundResponse = await client.refund(refundRequest);

    if (refundResponse.success) {
      booking.refundStatus = "Refund Initiated";
      booking.status = "Cancelled";
      booking.refundDetails = {
        merchantRefundId: refundRequest.merchantRefundId,
        refundTransactionId: refundResponse.data?.refundTransactionId || "NA",
        amount: booking.amount,
        response: refundResponse,
      };
      await booking.save();
      console.log(`Refund initiated successfully for booking ${merchantOrderId}`);
      return { success: true, message: "Refund initiated successfully." };
    } else {
      console.error(`PhonePe Refund API Error for ${merchantOrderId}:`, refundResponse);
      booking.refundStatus = "Refund Failed";
      booking.refundDetails = { response: refundResponse };
      await booking.save();
      return { success: false, message: "Failed to initiate refund with PhonePe." };
    }
  } catch (error) {
    console.error(`An unexpected error occurred during refund for ${merchantOrderId}:`, error);
    return { success: false, message: "An unexpected error occurred." };
  }
};

module.exports = {
  initiateRefund,
};