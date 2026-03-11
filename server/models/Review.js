// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    overall:   { type: Number, required: true, min: 1, max: 5 },
    surface:   { type: Number, min: 1, max: 5 },
    facilities:{ type: Number, min: 1, max: 5 },
    cleanliness:{ type: Number, min: 1, max: 5 },
    value:     { type: Number, min: 1, max: 5 }
  },
  title:   { type: String, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  images:  [{ public_id: String, url: String }],
  isVerified: { type: Boolean, default: false }, // verified purchase
  isApproved: { type: Boolean, default: true },
  ownerReply: {
    text:      String,
    repliedAt: Date
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

// One review per user per turf
ReviewSchema.index({ user: 1, turf: 1 }, { unique: true });
ReviewSchema.index({ turf: 1, isApproved: 1 });
ReviewSchema.index({ rating: -1 });

// ── Post-save: Update turf rating ─────────────────────────
ReviewSchema.post('save', async function() {
  await updateTurfRating(this.turf);
});

ReviewSchema.post('remove', async function() {
  await updateTurfRating(this.turf);
});

async function updateTurfRating(turfId) {
  const Turf = mongoose.model('Turf');
  const result = await mongoose.model('Review').aggregate([
    { $match: { turf: turfId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: '$rating.overall' }, count: { $sum: 1 } } }
  ]);

  if (result.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      'rating.average': Math.round(result[0].avg * 10) / 10,
      'rating.count': result[0].count
    });
  }
}

module.exports = mongoose.model('Review', ReviewSchema);
