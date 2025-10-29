// const axios = require("axios");

// const { MSG91_AUTHKEY, MSG91_WHATSAPP_NUMBER } = process.env;

// const sendWhatsAppConfirmation = async (name, phone, date, time, userLanguage) => {
//   // Fix the phone number format
//   let formattedPhone = phone;
//   if (!formattedPhone.startsWith("91")) {
//     formattedPhone = `91${formattedPhone}`;
//   }

//   // Determine which template to use based on the user's language preference
//   let TEMPLATE_NAME;
//   let TEMPLATE_LANGUAGE;

//   if (userLanguage === 'kn') {
//     TEMPLATE_NAME = "booking_confirmaton"; // e.g., 'booking_confirmation_kn'
//     TEMPLATE_LANGUAGE = "kn";
//   } else { // Default to English if no language is specified or it's not Kannada
//     TEMPLATE_NAME = "booking_confirmaton"; // e.g., 'booking_confirmation_en'
//     TEMPLATE_LANGUAGE = "en";
//   }

//   try {
//     const url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

//     const payload = {
//       integrated_number: MSG91_WHATSAPP_NUMBER,
//       content_type: "template",
//       payload: {
//         type: "template",
//         template: {
//           name: TEMPLATE_NAME,
//           language: {
//             code: TEMPLATE_LANGUAGE,
//             policy: "deterministic",
//           },
//           to_and_components: [
//             {
//               to: [formattedPhone],
//               components: {
//                 body_1: {
//                   type: "text",
//                   value: name,
//                 },
//                 body_2: {
//                   type: "text",
//                   value: date,
//                 },
//                 body_3: {
//                   type: "text",
//                   value: time,
//                 },
//               },
//             },
//           ],
//         },
//       },
//     };

//     const headers = {
//       authkey: MSG91_AUTHKEY,
//       "Content-Type": "application/json",
//     };

//     const response = await axios.post(url, payload, { headers });

//     console.log("WhatsApp message sent successfully:", response.data);
//   } catch (error) {
//     console.error(
//       "Failed to send WhatsApp message:",
//       error.response?.data || error.message
//     );
//   }
// };

// module.exports = {
//   sendWhatsAppConfirmation,
// };


const axios = require("axios");

const { MSG91_AUTHKEY, MSG91_WHATSAPP_NUMBER, ADMIN_NUMBER } = process.env;

const CUSTOMER_TEMPLATE_NAME = "booking_confirmaton";
const ADMIN_TEMPLATE_NAME = "admin_notification";

// Helper function to convert 24-hour time to 12-hour format
const formatTime = (time24) => {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(":")) return "N/A";
  let [hour, minute] = time24.split(":");
  const h = parseInt(hour, 10);
  const period = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;

  return `${formattedHour}:${minute} ${period}`;
};


const sendWhatsAppConfirmation = async (name, phone, date, time, userLanguage) => {
  let formattedPhone = phone;
  if (!formattedPhone.startsWith("91")) {
    formattedPhone = `91${formattedPhone}`;
  }

  const TEMPLATE_LANGUAGE = userLanguage === 'kn' ? "kn" : "en";

  try {
    const url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        type: "template",
        template: {
          name: CUSTOMER_TEMPLATE_NAME,
          language: {
            code: TEMPLATE_LANGUAGE,
            policy: "deterministic",
          },
          to_and_components: [{
            to: [formattedPhone],
            components: {
              body_1: { type: "text", value: name },
              body_2: { type: "text", value: date },
              body_3: { type: "text", value: formatTime(time) }, // Use the new function here
            },
          }],
        },
      },
    };

    const headers = {
      authkey: MSG91_AUTHKEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    console.log("Customer message sent successfully:", response.data);
  } catch (error) {
    console.error("Failed to send WhatsApp message to customer:", error.response?.data || error.message);
  }
};

const sendAdminNotification = async (name, phone, date, time, amount) => {
  if (!ADMIN_NUMBER) {
    console.error("ADMIN_NUMBER is not set in environment variables.");
    return;
  }

  try {
    const url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        type: "template",
        template: {
          name: ADMIN_TEMPLATE_NAME,
          language: {
            code: "en",
            policy: "deterministic",
          },
          to_and_components: [{
            to: [ADMIN_NUMBER],
            components: {
              body_1: { type: "text", value: name },
              body_2: { type: "text", value: phone },
              body_3: { type: "text", value: date },
              body_4: { type: "text", value: formatTime(time) }, // Use the new function here too
              body_5: { type: "text", value: amount.toString() },
            },
          }],
        },
      },
    };

    const headers = {
      authkey: MSG91_AUTHKEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    console.log("Admin notification sent successfully:", response.data);
  } catch (error) {
    console.error("Failed to send admin notification:", error.response?.data || error.message);
  }
};

module.exports = {
  sendWhatsAppConfirmation,
  sendAdminNotification,
};