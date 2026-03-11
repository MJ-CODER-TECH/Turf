// routes/locations.js
const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');

router.get('/', async (req, res) => {
  try {
    const cities = await Turf.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.city', state: { $first: '$location.state' }, count: { $sum: 1 }, avgRating: { $avg: '$rating.average' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: cities.map(c => ({ city: c._id, state: c.state, turfCount: c.count, avgRating: Math.round(c.avgRating * 10) / 10 })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch locations.' });
  }
});

router.get('/:city/turfs', async (req, res) => {
  try {
    const turfs = await Turf.find({ 'location.city': { $regex: req.params.city, $options: 'i' }, isActive: true })
      .select('name slug sport type price rating badge images location')
      .sort('-rating.average');
    res.json({ success: true, count: turfs.length, data: turfs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch turfs for city.' });
  }
});

module.exports = router;
