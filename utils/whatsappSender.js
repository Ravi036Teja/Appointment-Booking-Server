const axios = require("axios");

const sendWhatsappMessage = async ({ name, phone, date, timeSlot }) => {
  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/",
      {
        template_id: "YOUR_FLOW_ID", // Replace with your approved template or flow ID
        short_url: 0,
        recipient: `91${phone}`, // WhatsApp format with country code
        variables: {
          NAME: name,
          DATE: date,
          TIME: timeSlot,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          authkey: "YOUR_MSG91_API_KEY", // Replace with your MSG91 Auth Key
        },
      }
    );

    console.log("WhatsApp message sent ✅", response.data);
  } catch (error) {
    console.error("❌ WhatsApp message failed", error.response?.data || error.message);
  }
};

module.exports = sendWhatsappMessage;
