// routes/users.js
const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── Helper ─────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ── @PUT /users/profile ────────────────────────────────────
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('favouriteSport')
      .optional()
      .isIn(['football', 'cricket', 'badminton', 'basketball', 'tennis', 'other'])
      .withMessage('Invalid sport'),
    body('fcmToken').optional().isString(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const allowed = ['name', 'favouriteSport', 'fcmToken'];
      const updates = {};
      allowed.forEach(k => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update.' });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      res.json({ success: true, message: 'Profile updated successfully.', data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not update profile.' });
    }
  }
);

// ── @POST /users/favourites/:turfId ───────────────────────
router.post('/favourites/:turfId', protect, async (req, res) => {
  try {
    const { turfId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(turfId)) {
      return res.status(400).json({ success: false, message: 'Invalid turf ID.' });
    }

    const user = await User.findById(req.user.id).select('favouriteTurfs');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const idx = user.favouriteTurfs.findIndex(id => id.toString() === turfId);
    let message;
    let action;

    if (idx === -1) {
      user.favouriteTurfs.push(turfId);
      message = 'Added to favourites.';
      action  = 'added';
    } else {
      user.favouriteTurfs.splice(idx, 1);
      message = 'Removed from favourites.';
      action  = 'removed';
    }

    await user.save();
    res.json({ success: true, message, action });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update favourites.' });
  }
});

// ── @GET /users/wallet ─────────────────────────────────────
router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { balance: user.walletBalance } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch wallet.' });
  }
});

// ── @GET /users (Admin only) ───────────────────────────────
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { role, search } = req.query;

    const query = {};
    if (role)   query.role  = role;
    if (search) query.$or   = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .sort('-createdAt')
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-refreshToken'),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
});

// ── @DELETE /users/:id (Admin only) ───────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete user.' });
  }
});

module.exports = router;