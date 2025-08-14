const prisma = require('../models/prismaClient');
const bcrypt = require('bcryptjs');
const sendOtpEmail = require('../utils/sendOtpEmail');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const { full_name, email, phone_number } = req.body;

  try {
    const [firstName, ...rest] = full_name.trim().split(' ');
    const lastName = rest.join(' ') || null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone_number,
        otp,
        otpExpires,
        isVerified: false
      }
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({ message: 'OTP sent to your email', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // 👇 Check if verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your account first' });
    }

    // 👇 Check if password exists
    if (!user.password) {
      return res.status(401).json({ message: 'No password set for this user' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ message: 'OTP expired' });

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null
      }
    });

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};


exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Account not verified yet' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: 'Password set successfully. You can now log in.' });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Failed to set password', error: error.message });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpires }
    });

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ message: 'OTP expired' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, otpExpires: null }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};
