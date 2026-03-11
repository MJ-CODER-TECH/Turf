// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ── Helper: Send Token Response ───────────────────────────
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .cookie('refreshToken', refreshToken, { ...options, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .json({
      success: true,
      message,
      token,
      refreshToken,
      user: {
        id:            user._id,
        name:          user.name,
        email:         user.email,
        phone:         user.phone,
        role:          user.role,
        avatar:        user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        favouriteSport:  user.favouriteSport,
        walletBalance:   user.walletBalance,
      }
    });
};

// ── @POST /auth/register ───────────────────────────────────
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, favouriteSport } = req.body;

    // Check existing
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered.' });

    // Create user
    const user = await User.create({ name, email, phone, password, favouriteSport });

    // Generate email verification token
    const verifyToken = user.generateEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    // Send welcome email + verification
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await emailService.sendWelcome(user);
    await emailService.sendEmailVerification(user, verifyUrl);

    // Send welcome SMS
    await smsService.sendWelcomeSMS(phone, name);

    // Create welcome notification
    await Notification.create({
      user: user._id,
      type: 'system',
      title: 'Welcome to TurfZone! 🎉',
      message: `Hi ${name}! Your account is ready. Start booking premium turfs now.`,
      channels: { inApp: { sent: true, sentAt: new Date() } }
    });

    logger.info(`✅ New user registered: ${email}`);
    await sendTokenResponse(user, 201, res, 'Registration successful! Please verify your email.');

  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── @POST /auth/login ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    logger.info(`✅ User logged in: ${email}`);
    await sendTokenResponse(user, 200, res, 'Login successful!');

  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── @POST /auth/logout ─────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: '' });
    }
    res
      .clearCookie('token')
      .clearCookie('refreshToken')
      .status(200)
      .json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ── @GET /auth/me ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favouriteTurfs', 'name slug location.city sport price');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user data.' });
  }
};

// ── @POST /auth/send-phone-otp ────────────────────────────
exports.sendPhoneOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const otp = user.generatePhoneOTP();
    await user.save({ validateBeforeSave: false });

    const result = await smsService.sendOTP(user.phone, otp);
    if (!result.success && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again.' });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.phone.slice(0, -4).replace(/./g,'*')}${user.phone.slice(-4)}`,
      ...(process.env.NODE_ENV === 'development' && { otp }) // Expose OTP in dev mode only
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not send OTP.' });
  }
};

// ── @POST /auth/verify-phone ───────────────────────────────
exports.verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });

    const user = await User.findById(req.user.id).select('+phoneOTP +phoneOTPExpire');
    if (!user.phoneOTP || !user.phoneOTPExpire) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }
    if (user.phoneOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    if (user.phoneOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    user.isPhoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Phone number verified successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ── @GET /auth/verify-email/:token ───────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpire: { $gt: Date.now() }
    }).select('+emailVerifyToken +emailVerifyExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
};

// ── @POST /auth/forgot-password ───────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordReset(user, resetUrl);

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not send reset email.' });
  }
};

// ── @PUT /auth/reset-password/:token ─────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`✅ Password reset for: ${user.email}`);
    await sendTokenResponse(user, 200, res, 'Password reset successful!');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// ── @PUT /auth/change-password ────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not change password.' });
  }
};

// ── @POST /auth/refresh-token ─────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newToken = user.getSignedJwtToken();
    res.status(200).json({ success: true, token: newToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};
