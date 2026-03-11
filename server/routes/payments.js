// routes/payments.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const Booking = require('../models/Booking');

// @GET /payments/my
router.get('/my', protect, async (req, res) => {
  try {
    const payments = await Booking.find({ user: req.user.id, paymentStatus: 'paid' })
      .populate('turf', 'name location.area')
      .select('bookingId amount paymentMethod paymentStatus razorpayPaymentId date timeSlot')
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch payments.' });
  }
});

// @GET /payments/:paymentId/details
router.get('/:paymentId/details', protect, async (req, res) => {
  try {
    const result = await paymentService.getPaymentDetails(req.params.paymentId);
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.payment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch payment details.' });
  }
});

module.exports = router;
