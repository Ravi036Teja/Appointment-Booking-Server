// backend/models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    filename: { // Store the filename to easily delete from file system
        type: String,
        required: true,
        unique: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Image', imageSchema);
// models/Image.js
// const mongoose = require("mongoose");

// const imageSchema = new mongoose.Schema({
//   imageUrl: { type: String, required: true },
// });

// module.exports = mongoose.model("Image", imageSchema);
