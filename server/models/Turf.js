// models/Turf.js
const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  time: { type: String, required: true },        // "06:00", "18:00"
  isAvailable: { type: Boolean, default: true },
  price: { type: Number },                        // Override turf base price
}, { _id: false });

const PricingSchema = new mongoose.Schema({
  weekday: { type: Number, required: true },
  weekend: { type: Number, required: true },
  holiday: { type: Number },
  peak: {                                         // Peak hours pricing
    enabled: { type: Boolean, default: false },
    hours: [String],                              // ["18:00","19:00","20:00"]
    price: Number
  }
}, { _id: false });

const TurfSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Turf name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: { type: String, unique: true, lowercase: true },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  sport: {
    type: String,
    required: true,
    enum: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Box Cricket', 'Multi-Sport']
  },

  type: {
    type: String,
    required: true,
    // e.g. "5-a-side", "7-a-side", "Full Pitch", "4 Courts"
  },

  size: {
    length: Number,
    width: Number,
    unit: { type: String, default: 'meters' }
  },

  capacity: { type: Number, default: 10 },

  location: {
    address: { type: String, required: true },
    area:    { type: String, required: true },
    city:    { type: String, required: true, index: true },
    state:   { type: String, default: 'Maharashtra' },
    pincode: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    googleMapsUrl: String
  },

  pricing: { type: PricingSchema, required: true },

  // Backward compat: base price
  price: { type: Number },

  images: [{
    public_id: String,
    url:       String,
    alt:       String
  }],

  amenities: [{
    type: String,
    enum: [
      'Parking', 'Changing Room', 'Floodlit', 'Cafeteria', 'Washrooms',
      'First Aid', 'Equipment Rental', 'Coaching', 'Scoreboard', 'Referee',
      'AC Hall', 'Drinking Water', 'CCTV', 'WiFi', 'Refreshments',
      'Shower', 'Locker', 'Spectator Seating', 'PA System'
    ]
  }],

  slots: {
    type: Map,
    of: [SlotSchema],
    default: {}
    // Key = day of week: 'monday', 'tuesday' ... 'sunday'
    // Value = array of SlotSchema
  },

  // Default available time slots
  defaultSlots: {
    type: [String],
    default: ['06:00','07:00','08:00','09:00','10:00','11:00','12:00',
              '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
  },

  slotDuration: { type: Number, default: 60 }, // minutes

  operatingHours: {
    open:  { type: String, default: '06:00' },
    close: { type: String, default: '23:00' },
    closedDays: [{ type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] }]
  },

  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count:   { type: Number, default: 0 }
  },

  badge: {
    type: String,
    enum: ['Popular', 'New', 'Top Rated', 'Floodlit', 'Indoor', 'Premium', 'Full Ground', ''],
    default: ''
  },

  isActive:    { type: Boolean, default: true },
  isVerified:  { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },

  totalBookings: { type: Number, default: 0 },
  totalRevenue:  { type: Number, default: 0 },

  // Rules & cancellation policy
  rules: [String],
  cancellationPolicy: {
    freeUntilHours: { type: Number, default: 4 },  // free cancellation 4 hrs before
    refundPercent:  { type: Number, default: 100 }  // 100% refund
  },

  tags: [String],
  searchKeywords: [String],

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ── Indexes ────────────────────────────────────────────────
TurfSchema.index({ 'location.coordinates': '2dsphere' });
TurfSchema.index({ sport: 1, 'location.city': 1 });
TurfSchema.index({ 'rating.average': -1 });
TurfSchema.index({ isFeatured: 1, isActive: 1 });
TurfSchema.index({ slug: 1 });
TurfSchema.index({ '$**': 'text' }); // Full-text search

// ── Pre-save: Generate slug ────────────────────────────────
TurfSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  // Base price = weekday price
  if (this.pricing?.weekday) this.price = this.pricing.weekday;
  next();
});

// ── Virtual: primary image ────────────────────────────────
TurfSchema.virtual('primaryImage').get(function() {
  return this.images?.[0]?.url || '';
});

// ── Virtual: reviews (populate) ───────────────────────────
TurfSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'turf',
  justOne: false
});

module.exports = mongoose.model('Turf', TurfSchema);
