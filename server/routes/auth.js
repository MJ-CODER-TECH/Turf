// routes/auth.js
const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ── Validation Rules ───────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2–50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('phone')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('A valid 10-digit Indian mobile number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// ── Public Routes ──────────────────────────────────────────

// Register → saves to PendingUser, sends verification email
router.post('/register', registerValidation, authController.register);

// Verify email → creates real User, auto-logs in
router.get('/verify-email/:token', authController.verifyEmail);

// Resend verification email (for PendingUser who didn't receive it)
router.post('/resend-verification', authController.resendVerification);

// Login (only verified users can log in)
router.post('/login', loginValidation, authController.login);

// Forgot / Reset password
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, authController.resetPassword);

// Refresh access token
router.post('/refresh-token', authController.refreshToken);

// ── Protected Routes (require valid JWT) ──────────────────

router.post('/logout',         protect, authController.logout);
router.get('/me',              protect, authController.getMe);
router.post('/send-otp',       protect, authController.sendPhoneOTP);
router.post('/verify-phone',   protect, authController.verifyPhone);
router.put('/change-password', protect, changePasswordValidation, authController.changePassword);

module.exports = router;