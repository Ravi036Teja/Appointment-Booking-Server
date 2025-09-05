const axios = require("axios");

const { MSG91_AUTHKEY, MSG91_WHATSAPP_NUMBER } = process.env;

const sendWhatsAppConfirmation = async (name, phone, date, time, userLanguage) => {
  // Fix the phone number format
  let formattedPhone = phone;
  if (!formattedPhone.startsWith("91")) {
    formattedPhone = `91${formattedPhone}`;
  }

  // Determine which template to use based on the user's language preference
  let TEMPLATE_NAME;
  let TEMPLATE_LANGUAGE;

  if (userLanguage === 'kn') {
    TEMPLATE_NAME = "booking_confirmaton"; // e.g., 'booking_confirmation_kn'
    TEMPLATE_LANGUAGE = "kn";
  } else { // Default to English if no language is specified or it's not Kannada
    TEMPLATE_NAME = "booking_confirmaton"; // e.g., 'booking_confirmation_en'
    TEMPLATE_LANGUAGE = "en";
  }

  try {
    const url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: {
            code: TEMPLATE_LANGUAGE,
            policy: "deterministic",
          },
          to_and_components: [
            {
              to: [formattedPhone],
              components: {
                body_1: {
                  type: "text",
                  value: name,
                },
                body_2: {
                  type: "text",
                  value: date,
                },
                body_3: {
                  type: "text",
                  value: time,
                },
              },
            },
          ],
        },
      },
    };

    const headers = {
      authkey: MSG91_AUTHKEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });

    console.log("WhatsApp message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Failed to send WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

module.exports = {
  sendWhatsAppConfirmation,
};