// backend/routes/imageRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/ImageModel'); // Adjust path as per your structure

const router = express.Router();

// Configure Multer for image storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads'); // Adjust path to point to your backend's root uploads folder
        // Create the uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Error: Images Only! (jpeg, jpg, png, gif)');
    }
});

// @route   POST /api/gallery/upload
// @desc    Upload an image
// @access  Admin
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const newImage = new Image({
            imageUrl: `/uploads/${req.file.filename}`, // URL to access image from frontend
            filename: req.file.filename, // Original filename for deletion
        });

        await newImage.save();
        res.status(201).json({ message: 'Image uploaded successfully', image: newImage });
    } catch (err) {
        console.error(err);
        if (err.message.includes('Images Only')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error during image upload', error: err.message });
    }
});

// @route   GET /api/gallery
// @desc    Get all images
// @access  Public
router.get('/', async (req, res) => {
    try {
        const images = await Image.find().sort({ uploadedAt: -1 }); // Sort by most recent
        res.json(images);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching images' });
    }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete an image
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete from file system
        const filePath = path.join(__dirname, '../uploads', image.filename); // Adjust path
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Image.deleteOne({ _id: req.params.id });
        res.json({ message: 'Image deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting image', error: err.message });
    }
});

module.exports = router;