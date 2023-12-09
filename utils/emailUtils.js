// emailUtils.js

const nodemailer = require('nodemailer');

// Function to send an email
const sendEmail = async (email, url, subject) => {
  try {
    console.log('Sending email to:', email);
    
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || '',
      port: process.env.EMAIL_PORT || '',
      auth: {
        user: process.env.GMAIL_EMAIL || '',
        pass: process.env.GMAIL_PASSWORD || '',
      },
    });

    // Define the email options
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: subject,
      html: `Click the following link to reset your password: ${url}`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully!');
    console.log('Info:', info);

    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = { sendEmail };
