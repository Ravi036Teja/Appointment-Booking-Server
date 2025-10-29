const Image = require('../models/ImageModel');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mern-gallery', // Optional folder in Cloudinary
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

const upload = multer({ storage: storage });

// Controller for uploading a new image to Cloudinary
const uploadImage = async (req, res) => {
  try {
     console.log('Received upload request');
    if (!req.file) {
        console.error('No file received from frontend');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('File received:', req.file);

    const newImage = new Image({
      filename: req.file.filename,
      path: req.file.path, // This path will now be the Cloudinary URL
      public_id: req.file.filename, // Store Cloudinary's public ID to allow for deletion
    });

    await newImage.save();
    res.status(201).json({ message: 'Image uploaded successfully!', image: newImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for fetching all images from the database
const getGalleryImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for deleting an image from the database and Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the image from Cloudinary using its public_id
    await cloudinary.uploader.destroy(image.public_id);

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