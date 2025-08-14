// utils/sendOtpEmail.js
const nodemailer = require('nodemailer');

const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or another provider like 'outlook', 'zoho'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"OWODE" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OWODE Verification Code',
      html: `
        <div style="font-family:sans-serif; max-width:500px; margin:auto;">
          <h2>Welcome to OWODE 👋</h2>
          <p>Your verification code is:</p>
          <div style="font-size:32px; font-weight:bold; color:#4f46e5;">${otp}</div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn’t request this, you can ignore this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error('Email delivery failed');
  }
};

module.exports = sendOtpEmail;
