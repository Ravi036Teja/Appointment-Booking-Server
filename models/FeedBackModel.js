const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true }, // Add the new phone field
        message: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);