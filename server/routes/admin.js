// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

router.use(protect, authorize('admin'));

// @GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalTurfs, totalBookings, totalRevenue,
      todayBookings, monthRevenue, recentBookings, topTurfs,
      pendingTurfs, userGrowth
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Turf.countDocuments({ isActive: true }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] } }),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount.total' } } }]),
      Booking.countDocuments({ createdAt: { $gte: todayStart } }),
      Booking.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount.total' } } }]),
      Booking.find({ status: 'confirmed' }).sort('-createdAt').limit(10).populate('user', 'name email').populate('turf', 'name location.city'),
      Turf.find({ isActive: true }).sort('-totalBookings').limit(5).select('name totalBookings totalRevenue rating'),
      Turf.countDocuments({ isVerified: false, isActive: true }),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTurfs,
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          todayBookings,
          monthRevenue: monthRevenue[0]?.total || 0,
          pendingVerifications: pendingTurfs
        },
        recentBookings,
        topTurfs,
        userGrowth
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch dashboard data.' });
  }
});

// @PUT /admin/turfs/:id/verify
router.put('/turfs/:id/verify', async (req, res) => {
  try {
    const turf = await Turf.findByIdAndUpdate(req.params.id, { isVerified: true, isFeatured: req.body.isFeatured || false }, { new: true });
    res.json({ success: true, message: 'Turf verified.', data: turf });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not verify turf.' });
  }
});

// @PUT /admin/users/:id/toggle
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not toggle user.' });
  }
});

// @GET /admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const query = {};
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('turf', 'name location.city')
      .sort('-createdAt').limit(limit * 1).skip((page - 1) * limit);
    const total = await Booking.countDocuments(query);
    res.json({ success: true, data: bookings, pagination: { page: +page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch bookings.' });
  }
});

// @DELETE /admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { isApproved: false });
    res.json({ success: true, message: 'Review hidden.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not hide review.' });
  }
});

module.exports = router;
