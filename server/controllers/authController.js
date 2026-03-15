// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ── Helper: Send Token Response ───────────────────────────
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex'); // Store hashed
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict' // ← CHANGE THIS
};

  res
    .status(statusCode)
    .cookie('token', token, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    .json({
      success: true,
      message,
      token,
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        phone:           user.phone,
        role:            user.role,
        avatar:          user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        favouriteSport:  user.favouriteSport,
        walletBalance:   user.walletBalance,
      }
    });
};

// ── @POST /auth/register ───────────────────────────────────
// Flow: Save to PendingUser → Send verification email → 
//       User clicks link → Move to User collection
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, favouriteSport } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a verified user
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }]
    });
    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Phone number';
      return res.status(400).json({ success: false, message: `${field} already registered.` });
    }

    // Remove any old pending registration for same email/phone
    await PendingUser.deleteMany({ $or: [{ email: normalizedEmail }, { phone }] });

    // Create pending record (NOT in User collection yet)
    const pending = await PendingUser.create({
      name,
      email: normalizedEmail,
      phone,
      password,       // PendingUser schema will hash this
      favouriteSport,
    });

    // Generate verification token
    const verifyToken = pending.generateEmailVerifyToken();
    await pending.save({ validateBeforeSave: false });

    // Send verification email (trim trailing slash to prevent double-slash URLs)
    const baseUrl   = process.env.FRONTEND_URL.replace(/\/+$/, '');
    const verifyUrl = `${baseUrl}/verify-email/${verifyToken}`;
    await emailService.sendEmailVerification({ name, email: normalizedEmail }, verifyUrl);

    logger.info(`📋 Pending registration: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Almost there! Please check your email and click the verification link to complete registration.',
    });

  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── @GET /auth/verify-email/:token ────────────────────────
// Moves user from PendingUser → User (real account created here)
exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const pending = await PendingUser.findOne({
      emailVerifyToken:  hashedToken,
      emailVerifyExpire: { $gt: Date.now() }
    }).select('+password +emailVerifyToken +emailVerifyExpire');

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired. Please register again.',
      });
    }

    // Double-check no verified user was created in the meantime
    const alreadyExists = await User.findOne({ email: pending.email });
    if (alreadyExists) {
      await PendingUser.findByIdAndDelete(pending._id);
      return res.status(400).json({
        success: false,
        message: 'This email is already verified. Please log in.',
      });
    }

    // Create the real user now
// Create the real user now (password already hashed in PendingUser)
const userData = {
  name:            pending.name,
  email:           pending.email,
  phone:           pending.phone,
  password:        pending.password, // already hashed!
  isEmailVerified: true,
};
if (pending.favouriteSport) userData.favouriteSport = pending.favouriteSport;
// ✅ new + save instead of create (to skip password hashing)
const user = new User(userData);
user.$locals.skipPasswordHash = true;
await user.save({ validateBeforeSave: false });
    // Clean up pending record
    await PendingUser.findByIdAndDelete(pending._id);

    // Send welcome SMS
    try {
      await smsService.sendWelcomeSMS(user.phone, user.name);
    } catch (smsErr) {
      logger.warn(`Welcome SMS failed for ${user.phone}: ${smsErr.message}`);
    }

    // Send welcome email
    try {
      await emailService.sendWelcome(user);
    } catch (mailErr) {
      logger.warn(`Welcome email failed for ${user.email}: ${mailErr.message}`);
    }

    // Create welcome notification
    await Notification.create({
      user:    user._id,
      type:    'system',
      title:   'Welcome to TurfZone! 🎉',
      message: `Hi ${user.name}! Your account is ready. Start booking premium turfs now.`,
      channels: { inApp: { sent: true, sentAt: new Date() } }
    });

    logger.info(`✅ New user verified & created: ${user.email}`);

    // Auto-login after verification
    await sendTokenResponse(user, 201, res, 'Email verified! Welcome to TurfZone 🎉');

  } catch (err) {
    logger.error(`Email verify error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Email verification failed. Please try again.' });
  }
};

// ── @POST /auth/resend-verification ───────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();

    // Already verified?
    const verifiedUser = await User.findOne({ email: normalizedEmail });
    if (verifiedUser) {
      return res.status(400).json({ success: false, message: 'This email is already verified. Please log in.' });
    }

    const pending = await PendingUser.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'No pending registration found. Please register again.' });
    }

    // Rate limit: don't allow resend if last token sent < 2 minutes ago
    if (pending.emailVerifyExpire) {
      const tokenAge = (pending.emailVerifyExpire - Date.now()) / 1000; // seconds remaining
      const maxAge = parseInt(process.env.EMAIL_VERIFY_EXPIRE_HOURS || 24) * 3600;
      const elapsed = maxAge - tokenAge;
      if (elapsed < 120) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(120 - elapsed)} seconds before requesting another email.`
        });
      }
    }

    const verifyToken = pending.generateEmailVerifyToken();
    await pending.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await emailService.sendEmailVerification({ name: pending.name, email: pending.email }, verifyUrl);

    res.status(200).json({ success: true, message: 'Verification email resent. Please check your inbox.' });
  } catch (err) {
    logger.error(`Resend verification error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not resend verification email.' });
  }
};

// ── @POST /auth/login ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');

    if (!user) {
      // Check if pending (not verified yet)
      const pending = await PendingUser.findOne({ email: normalizedEmail });
      if (pending) {
        return res.status(401).json({
          success: false,
          message: 'Please verify your email first. Check your inbox or resend the verification email.',
          requiresVerification: true,
          email: normalizedEmail,
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact support.' });
    }

    if (!user.isEmailVerified) {
      // Shouldn't happen with new flow, but guard for old data
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    logger.info(`✅ User logged in: ${normalizedEmail}`);
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
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { refreshToken: '' }
      });
    }
    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
    res
      .clearCookie('token', cookieOptions)
      .clearCookie('refreshToken', cookieOptions)
      .status(200)
      .json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ── @GET /auth/me ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favouriteTurfs', 'name slug location.city sport pricing');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    logger.error(`GetMe error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch user data.' });
  }
};

// ── @POST /auth/send-phone-otp ─────────────────────────────
exports.sendPhoneOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+phoneOTP +phoneOTPExpire');

    // Rate limit: 1 OTP per 60 seconds
    if (user.phoneOTPExpire) {
      const otpAge = (user.phoneOTPExpire - Date.now()) / 1000;
      const maxAge = parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60;
      const elapsed = maxAge - otpAge;
      if (elapsed < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting another OTP.`
        });
      }
    }

    const otp = user.generatePhoneOTP();
    await user.save({ validateBeforeSave: false });

    const result = await smsService.sendOTP(user.phone, otp);

    if (!result.success && process.env.NODE_ENV === 'production') {
      // Clear the OTP so user can retry
      user.phoneOTP = undefined;
      user.phoneOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    const maskedPhone = `${user.phone.slice(0, -4).replace(/\d/g, '*')}${user.phone.slice(-4)}`;

    res.status(200).json({
      success: true,
      message: `OTP sent to ${maskedPhone}`,
      expiresIn: parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60, // seconds
      ...(process.env.NODE_ENV !== 'production' && { otp }) // Only in dev/staging
    });
  } catch (err) {
    logger.error(`Send OTP error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not send OTP.' });
  }
};

// ── @POST /auth/verify-phone ───────────────────────────────
exports.verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'OTP must be 6 digits.' });

    const user = await User.findById(req.user.id).select('+phoneOTP +phoneOTPExpire');

    if (!user.phoneOTP || !user.phoneOTPExpire) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }
    if (Date.now() > user.phoneOTPExpire) {
      user.phoneOTP = undefined;
      user.phoneOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
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
    logger.error(`Verify phone error: ${err.message}`);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ── @POST /auth/forgot-password ───────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a password reset link has been sent.'
      });
    }

    // Rate limit: 1 reset email per 15 minutes
    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      const remainingSecs = Math.ceil((user.resetPasswordExpire - Date.now()) / 1000);
      const remainingMins = Math.ceil(remainingSecs / 60);
      if (remainingSecs > (parseInt(process.env.RESET_TOKEN_EXPIRE_MINUTES || 60) - 15) * 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingMins} minutes before requesting another reset link.`
        });
      }
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const baseUrl  = process.env.FRONTEND_URL.replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    const emailResult = await emailService.sendPasswordReset(user, resetUrl);

    if (!emailResult.success) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error(`Forgot password email failed: ${user.email}`);
      return res.status(500).json({ success: false, message: 'Could not send reset email. Please try again.' });
    }

    logger.info(`✅ Password reset email sent: ${user.email}`);
    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });

  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not send reset email.' });
  }
};

// ── @PUT /auth/reset-password/:token ──────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password) return res.status(400).json({ success: false, message: 'Password is required.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    logger.info(`✅ Password reset for: ${user.email}`);
    await sendTokenResponse(user, 200, res, 'Password reset successful! You are now logged in.');

  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
  }
};

// ── @PUT /auth/change-password ─────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate all other sessions
    await user.save();

    logger.info(`✅ Password changed for: ${user.email}`);
    res.status(200).json({ success: true, message: 'Password changed successfully. Please log in again on other devices.' });

  } catch (err) {
    logger.error(`Change password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not change password.' });
  }
};

// ── @POST /auth/refresh-token ──────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    // Support both body and cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== hashedToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token. Please log in again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    const newToken = user.getSignedJwtToken();
    logger.info(`🔄 Token refreshed for user: ${user.email}`);

    res.status(200).json({ success: true, token: newToken });

  } catch (err) {
    logger.error(`Refresh token error: ${err.message}`);
    res.status(401).json({ success: false, message: 'Token refresh failed.' });
  }
};