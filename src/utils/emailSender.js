// src/utils/emailSender.js

const nodemailer = require('nodemailer');
const TOKEN = "18a9c5d209cd52d10248864f00fb7a6c";

// PASTE YOUR UNIQUE MAILTRAP CREDENTIALS HERE
const transporter = nodemailer.createTransport({
    // 1. Host (e.g., sandbox.smtp.mailtrap.io)
    host: 'live.smtp.mailtrap.io', 
    port: 587,   
    auth: {
        user: 'smtp@mailtrap.io',
        pass: TOKEN
    }
});

/**
 * Sends a password reset email to the user.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} token - The secure reset token.
 */
exports.sendPasswordResetEmail = async (toEmail, token) => {
    // Note: The 'from' address does not have to be a real domain when using Mailtrap for testing
    const senderEmail = 'kshnptl10@gmail.com'; // Use a placeholder email here
    
    const resetURL = `http://localhost:3000/customer/reset-password.html?token=${token}`;
    
    const mailOptions = {
        from: `"Your Salon App" <${senderEmail}>`,
        to: toEmail,
        subject: 'Password Reset Request',
        html: `
            <p>You requested a password reset for your account.</p>
            <p>Please click this link to complete the process. This link is valid for 1 hour:</p>
            <a href="${resetURL}">${resetURL}</a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email successfully captured by Mailtrap: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password reset email (Check Mailtrap config):', error);
        return false;
    }
};