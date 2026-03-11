// controllers/turfController.js
const Turf = require('../models/Turf');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

// ── @GET /turfs ───────────────────────────────────────────
exports.getTurfs = async (req, res) => {
  try {
    const {
      search, sport, city, minPrice, maxPrice,
      rating, amenities, badge, isFeatured,
      sort = '-rating.average', page = 1, limit = 12,
      lat, lng, radius = 10 // km
    } = req.query;

    const query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (sport)      query.sport = sport;
    if (city)       query['location.city'] = { $regex: city, $options: 'i' };
    if (badge)      query.badge = badge;
    if (isFeatured === 'true') query.isFeatured = true;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Min rating
    if (rating) query['rating.average'] = { $gte: parseFloat(rating) };

    // Amenities
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenityList };
    }

    // Geo query (if lat/lng provided)
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius) * 1000 // convert km to meters
        }
      };
    }

    // Sort options
    const sortMap = {
      'price_asc':  'price',
      'price_desc': '-price',
      'rating':     '-rating.average',
      'popular':    '-totalBookings',
      'new':        '-createdAt',
      'name':       'name'
    };
    const sortStr = sortMap[sort] || sort;

    const turfs = await Turf.find(query)
      .select('-slots -searchKeywords -__v')
      .populate('owner', 'name email phone')
      .sort(sortStr)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Turf.countDocuments(query);

    res.status(200).json({
      success: true,
      data: turfs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { sport, city, minPrice, maxPrice, rating, sort }
    });
  } catch (err) {
    logger.error(`Get turfs error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch turfs.' });
  }
};

// ── @GET /turfs/featured ──────────────────────────────────
exports.getFeaturedTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ isActive: true, isFeatured: true })
      .select('name slug sport type location pricing price images rating badge amenities')
      .sort('-rating.average')
      .limit(6);
    res.status(200).json({ success: true, data: turfs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch featured turfs.' });
  }
};

// ── @GET /turfs/:id ───────────────────────────────────────
exports.getTurf = async (req, res) => {
  try {
    const query = req.params.id.includes('-')
      ? { slug: req.params.id, isActive: true }
      : { _id: req.params.id, isActive: true };

    const turf = await Turf.findOne(query)
      .populate('owner', 'name email phone')
      .populate({
        path: 'reviews',
        match: { isApproved: true },
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: { path: 'user', select: 'name avatarUrl' }
      });

    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    res.status(200).json({ success: true, data: turf });
  } catch (err) {
    logger.error(`Get turf error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch turf.' });
  }
};

// ── @POST /turfs (owner/admin) ────────────────────────────
exports.createTurf = async (req, res) => {
  try {
    req.body.owner = req.user.id;
    const turf = await Turf.create(req.body);
    res.status(201).json({ success: true, message: 'Turf created successfully!', data: turf });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A turf with this name already exists.' });
    }
    logger.error(`Create turf error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not create turf.' });
  }
};

// ── @PUT /turfs/:id ───────────────────────────────────────
exports.updateTurf = async (req, res) => {
  try {
    let turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    if (turf.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this turf.' });
    }

    // Prevent changing owner
    delete req.body.owner;
    delete req.body.totalBookings;
    delete req.body.totalRevenue;

    turf = await Turf.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });

    res.status(200).json({ success: true, message: 'Turf updated successfully.', data: turf });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update turf.' });
  }
};

// ── @DELETE /turfs/:id ────────────────────────────────────
exports.deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    if (turf.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this turf.' });
    }

    // Soft delete
    turf.isActive = false;
    await turf.save();

    res.status(200).json({ success: true, message: 'Turf deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete turf.' });
  }
};

// ── @GET /turfs/:id/stats (owner/admin) ───────────────────
exports.getTurfStats = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    if (turf.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [stats, recentBookings, ratingBreakdown] = await Promise.all([
      Booking.aggregate([
        { $match: { turf: turf._id, status: { $in: ['confirmed', 'completed'] } } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          revenue: { $sum: '$amount.total' },
          avgAmount: { $avg: '$amount.total' }
        }}
      ]),
      Booking.find({ turf: turf._id, createdAt: { $gte: thirtyDaysAgo } })
        .populate('user', 'name phone')
        .sort('-createdAt').limit(10),
      Review.aggregate([
        { $match: { turf: turf._id } },
        { $group: { _id: '$rating.overall', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, revenue: 0, avgAmount: 0 },
        rating: turf.rating,
        ratingBreakdown,
        recentBookings,
        totalBookings: turf.totalBookings,
        totalRevenue: turf.totalRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch stats.' });
  }
};

// ── @GET /turfs/cities ────────────────────────────────────
exports.getCities = async (req, res) => {
  try {
    const cities = await Turf.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, data: cities.map(c => ({ city: c._id, count: c.count })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch cities.' });
  }
};
