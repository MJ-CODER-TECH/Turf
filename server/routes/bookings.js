// routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// ✅ Webhook — raw() hata do, server.js handle kar raha hai
router.post('/webhook', bookingController.handleWebhook);

// ✅ Public route — before protect
router.get('/availability', bookingController.checkAvailability);

// All routes below require auth
router.use(protect);

router.get('/my',           bookingController.getMyBookings);
router.post('/initiate',    bookingController.initiateBooking);
router.post('/confirm',     bookingController.confirmBooking);
router.get('/:id',          bookingController.getBooking);
router.post('/:id/cancel',  bookingController.cancelBooking);

module.exports = router;