// routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').matches(/^(\+91|91)?[6-9]\d{9}$/).withMessage('Valid Indian phone required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 characters')
];

router.post('/register',       registerValidation, authController.register);
router.post('/login',          authController.login);
router.post('/logout',         protect, authController.logout);
router.get('/me',              protect, authController.getMe);
router.post('/send-otp',       protect, authController.sendPhoneOTP);
router.post('/verify-phone',   protect, authController.verifyPhone);
router.get('/verify-email/:token',    authController.verifyEmail);
router.post('/forgot-password',       authController.forgotPassword);
router.put('/reset-password/:token',  authController.resetPassword);
router.put('/change-password', protect, authController.changePassword);
router.post('/refresh-token',  authController.refreshToken);

module.exports = router;
