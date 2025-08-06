// // const axios = require("axios");

// // const sendWhatsappMessage = async ({ name, phone, date, timeSlot }) => {
// //   try {
// //     const response = await axios.post(
// //       "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/",
// //       {
// //         template_id: "YOUR_FLOW_ID", // Replace with your approved template or flow ID
// //         short_url: 0,
// //         recipient: `91${phone}`, // WhatsApp format with country code
// //         variables: {
// //           NAME: name,
// //           DATE: date,
// //           TIME: timeSlot,
// //         },
// //       },
// //       {
// //         headers: {
// //           "Content-Type": "application/json",
// //           authkey: "YOUR_MSG91_API_KEY", // Replace with your MSG91 Auth Key
// //         },
// //       }
// //     );

// //     console.log("WhatsApp message sent ✅", response.data);
// //   } catch (error) {
// //     console.error("❌ WhatsApp message failed", error.response?.data || error.message);
// //   }
// // };

// // module.exports = sendWhatsappMessage;


// // Example of utils/whatsappSender.js
// // You need to replace this with your actual WhatsApp API integration logic
// // This is a placeholder for your actual WhatsApp API call (Meta Business API)

// // const axios = require("axios");

// // const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN; // Your permanent access token
// // const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Your WhatsApp Business Phone Number ID

// // async function sendWhatsAppMessage(to, message) {
// //   if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
// //     console.warn("WhatsApp API token or phone number ID not configured. Skipping message.");
// //     return;
// //   }

// //   try {
// //     const response = await axios.post(
// //       `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //       {
// //         messaging_product: "whatsapp",
// //         to: to, // User's phone number
// //         type: "text", // For simple text messages
// //         text: {
// //           body: message,
// //         },
// //         // For structured messages or templates, you'd use 'template' type
// //         // Example for template (requires pre-approved template on Meta):
// //         /*
// //         type: "template",
// //         template: {
// //             name: "booking_confirmation", // Name of your pre-approved template
// //             language: {
// //                 code: "en" // or "kn" for Kannada
// //             },
// //             components: [
// //                 {
// //                     type: "body",
// //                     parameters: [
// //                         { type: "text", text: "Name" },
// //                         { type: "text", text: "Date" },
// //                         { type: "text", text: "Time" }
// //                     ]
// //                 }
// //             ]
// //         }
// //         */
// //       },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );
// //     console.log("WhatsApp message sent successfully:", response.data);
// //   } catch (error) {
// //     console.error("Error sending WhatsApp message:");
// //     if (error.response) {
// //       console.error("Status:", error.response.status);
// //       console.error("Data:", error.response.data);
// //     } else {
// //       console.error(error.message);
// //     }
// //   }
// // }

// // module.exports = sendWhatsAppMessage;

// // backend/services/whatsappService.js
// const axios = require('axios');

// const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const API_BASE_URL = process.env.WHATSAPP_API_BASE_URL;

// if (!PHONE_NUMBER_ID || !ACCESS_TOKEN || !API_BASE_URL) {
//     console.error("WhatsApp API credentials are not fully configured in environment variables.");
//     // Consider exiting or throwing an error in production
// }

// const sendWhatsappMessage = async (to, templateName, components = []) => {
//     if (!to || !templateName) {
//         console.error("Recipient number and template name are required to send WhatsApp message.");
//         return;
//     }

//     const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;

//     const messagePayload = {
//         messaging_product: "whatsapp",
//         to: to, // The user's WhatsApp number
//         type: "template",
//         template: {
//             name: templateName, // e.g., "hello_world" or "appointment_booked"
//             language: {
//                 code: "en_US" // Or the appropriate language code for your template
//             },
//             components: components // Array of objects for template variables
//         }
//     };

//     // Example for 'hello_world' template:
//     // messagePayload.template.components = [
//     //     {
//     //         type: "body",
//     //         parameters: [
//     //             {
//     //                 type: "text",
//     //                 text: "Your Name" // Parameter for {{1}} in hello_world
//     //             }
//     //         ]
//     //     }
//     // ];

//     try {
//         const response = await axios.post(url, messagePayload, {
//             headers: {
//                 'Authorization': `Bearer ${ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         console.log(`WhatsApp message sent successfully to ${to}. Message ID: ${response.data.messages[0].id}`);
//         return response.data;
//     } catch (error) {
//         console.error(`Error sending WhatsApp message to ${to}:`, error.response?.data || error.message);
//         // Log full error for debugging, but be careful with sensitive data in production logs
//         if (error.response?.data) {
//             console.error("WhatsApp API Error Details:", JSON.stringify(error.response.data, null, 2));
//         }
//         throw new Error("Failed to send WhatsApp message."); // Re-throw to be caught by caller
//     }
// };

// module.exports = { sendWhatsappMessage };

const sendWhatsAppMessage = async (phone, message) => {
  try {
    // This is a placeholder - implement your actual WhatsApp API integration
    console.log(`WhatsApp message to ${phone}: ${message}`);
    
    // Example using WhatsApp Business API or third-party service
    // Replace this with your actual WhatsApp integration
    
    return { success: true };
  } catch (error) {
    console.error("WhatsApp sending failed:", error);
    throw error;
  }
};

module.exports = sendWhatsAppMessage;