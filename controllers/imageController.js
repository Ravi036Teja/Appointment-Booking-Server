const Image = require('../models/ImageModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the 'uploads' directory exists
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Controller for uploading a new image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newImage = new Image({
      filename: req.file.filename,
      path: req.file.path,
    });

    await newImage.save();
    res.status(201).json({ message: 'Image uploaded successfully!', image: newImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for fetching all images for the gallery
const getGalleryImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for deleting an image
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the physical file from the uploads directory
    fs.unlink(image.path, (err) => {
      if (err) {
        console.error('Failed to delete image file:', err);
      }
    });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  upload,
  uploadImage,
  getGalleryImages,
  deleteImage,
};