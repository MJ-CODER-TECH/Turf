// routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @GET /reviews?turfId=xxx
router.get('/', async (req, res) => {
  try {
    const { turfId, page = 1, limit = 10 } = req.query;
    const query = { isApproved: true };
    if (turfId) query.turf = turfId;

    const reviews = await Review.find(query)
      .populate('user', 'name avatarUrl')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({ success: true, data: reviews, pagination: { page: +page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch reviews.' });
  }
});

// @POST /reviews
router.post('/', protect, async (req, res) => {
  try {
    const { turfId, bookingId, rating, title, comment } = req.body;

    // Verify completed booking
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id, status: 'completed' });
    if (!booking) return res.status(403).json({ success: false, message: 'You can only review after a completed booking.' });
    if (booking.hasReviewed) return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });

    const review = await Review.create({
      user: req.user.id, turf: turfId, booking: bookingId,
      rating, title, comment, isVerified: true
    });

    booking.hasReviewed = true;
    await booking.save();

    res.status(201).json({ success: true, message: 'Review submitted!', data: review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You already reviewed this turf.' });
    res.status(500).json({ success: false, message: 'Could not submit review.' });
  }
});

// @POST /reviews/:id/reply (owner/admin)
router.post('/:id/reply', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id,
      { ownerReply: { text: req.body.text, repliedAt: new Date() } },
      { new: true }
    );
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not add reply.' });
  }
});

module.exports = router;
