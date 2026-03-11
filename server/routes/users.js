// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @PUT /users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'favouriteSport', 'fcmToken'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
});

// @POST /users/favourites/:turfId
router.post('/favourites/:turfId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const turfId = req.params.turfId;
    const idx = user.favouriteTurfs.indexOf(turfId);
    let message;
    if (idx === -1) { user.favouriteTurfs.push(turfId); message = 'Added to favourites.'; }
    else            { user.favouriteTurfs.splice(idx, 1); message = 'Removed from favourites.'; }
    await user.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update favourites.' });
  }
});

// @GET /users/wallet
router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    res.json({ success: true, data: { balance: user.walletBalance } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch wallet.' });
  }
});

// Admin: get all users
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort('-createdAt').limit(limit * 1).skip((page - 1) * limit);
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, pagination: { page: +page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
});

module.exports = router;
