// routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// Webhook (no auth - Razorpay calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), bookingController.handleWebhook);

// Protected routes
router.use(protect);

router.get('/availability',    bookingController.checkAvailability);
router.get('/my',              bookingController.getMyBookings);
router.post('/initiate',       bookingController.initiateBooking);
router.post('/confirm',        bookingController.confirmBooking);
router.get('/:id',             bookingController.getBooking);
router.post('/:id/cancel',     bookingController.cancelBooking);

module.exports = router;
