// const crypto = require("crypto");

// const generateXVerifyHeader = (payload, saltKey, saltIndex) => {
//   const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
//   const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
//   const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
//   return {
//     base64Payload,
//     xVerify: `${sha256}###${saltIndex}`,
//   };
// };

import crypto from "crypto";

function generateXVerifyHeader(payload, endpoint, saltKey, saltIndex) {
  const baseString = payload + endpoint + saltKey;
  const sha256 = crypto.createHash("sha256").update(baseString).digest("hex");
  return `${sha256}###${saltIndex}`;
}


module.exports = { generateXVerifyHeader };
