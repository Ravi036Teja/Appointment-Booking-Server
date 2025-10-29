// Example Server-Side Code (Node.js/Express)
const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const Admin = require('../models/AdminUser'); // Your Admin database model

// Configure your email transporter (e.g., using Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password'
    }
});

// Admin invite route (protected - only accessible by a logged-in admin)
router.post('/invite', async (req, res) => {
    const { email } = req.body;
    try {
        // 1. Generate a unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // 2. Save the token to the database (or a dedicated invites collection)
        const invite = await Admin.findOneAndUpdate(
            { email },
            { invitationToken: token, invitationExpires: expires },
            { upsert: true, new: true }
        );

        // 3. Send the email
        const mailOptions = {
            to: email,
            from: 'your_email@gmail.com',
            subject: 'Admin Account Invitation',
            html: `<p>You have been invited to create an admin account. Click the link to get started:</p>
                   <a href="https://yourwebsite.com/admin/signup?token=${token}">Create your account</a>`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Invitation sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send invitation.' });
    }
});

module.exports = router;