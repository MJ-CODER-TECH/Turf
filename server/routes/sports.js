// routes/sports.js
const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');

router.get('/', async (req, res) => {
  try {
    const sports = await Turf.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$sport', count: { $sum: 1 }, avgPrice: { $avg: '$price' }, avgRating: { $avg: '$rating.average' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: sports.map(s => ({ sport: s._id, turfCount: s.count, avgPrice: Math.round(s.avgPrice), avgRating: Math.round(s.avgRating * 10) / 10 })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch sports.' });
  }
});

router.get('/:sport/turfs', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const turfs = await Turf.find({ sport: req.params.sport, isActive: true })
      .select('name slug type price rating badge images location')
      .sort('-rating.average')
      .limit(limit * 1).skip((page - 1) * limit);
    const total = await Turf.countDocuments({ sport: req.params.sport, isActive: true });
    res.json({ success: true, data: turfs, pagination: { page: +page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch turfs.' });
  }
});

module.exports = router;
