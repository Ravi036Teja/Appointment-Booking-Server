const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String, // This will store the Cloudinary URL
    required: true,
  },
  public_id: {
    type: String, // Cloudinary's public_id for file deletion
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;