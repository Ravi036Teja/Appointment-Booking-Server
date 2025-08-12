const express = require('express');
const router = express.Router();
const { upload, uploadImage, getGalleryImages, deleteImage } = require('../controllers/imageController');

// Route for admin to upload an image
router.post('/upload', upload.single('image'), uploadImage);

// Route for users and admin to view the gallery
router.get('/', getGalleryImages);

// Route for admin to delete an image
router.delete('/:id', deleteImage);

module.exports = router;