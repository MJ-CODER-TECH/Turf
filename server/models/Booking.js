// models/Booking.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => 'TZ' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,4).toUpperCase()
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true,
    index: true
  },

  // Snapshot of turf details at booking time (in case turf info changes)
  turfSnapshot: {
    name:     String,
    location: String,
    city:     String,
    sport:    String,
    ownerPhone: String
  },

  date: {
    type: Date,
    required: [true, 'Booking date is required'],
    index: true
  },

  timeSlot: {
    start: { type: String, required: true },   // "18:00"
    end:   { type: String, required: true },   // "19:00"
  },

  duration: { type: Number, default: 60 },   // in minutes

  players: { type: Number, default: 10 },

  amount: {
    base:      { type: Number, required: true },
    discount:  { type: Number, default: 0 },
    taxes:     { type: Number, default: 0 },
    total:     { type: Number, required: true }
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending',
    index: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed', 'partially_refunded'],
    default: 'pending'
  },

  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet', 'cash'],
  },

  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Cancellation
  cancelledBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt:    Date,
  cancellationReason: String,
  refundAmount:   { type: Number, default: 0 },
  refundStatus:   { type: String, enum: ['pending', 'processed', 'failed', ''], default: '' },
  refundId:       String,

  // QR Code for entry
  qrCode: String,

  // Notes
  userNote:   String,
  adminNote:  String,

  // Reminders sent
  reminder24hSent: { type: Boolean, default: false },
  reminder1hSent:  { type: Boolean, default: false },

  // Confirmation
  confirmationSentAt: Date,
  smsSentAt:         Date,

  // Rating
  hasReviewed: { type: Boolean, default: false },

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
BookingSchema.index({ date: 1, turf: 1, 'timeSlot.start': 1 });
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ createdAt: -1 });

// ── Virtual: isUpcoming ───────────────────────────────────
BookingSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date() && this.status === 'confirmed';
});

// ── Virtual: canCancel ────────────────────────────────────
BookingSchema.virtual('canCancel').get(function() {
  if (this.status !== 'confirmed') return false;
  const bookingDateTime = new Date(this.date);
  const [h, m] = this.timeSlot.start.split(':');
  bookingDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
  const hoursUntil = (bookingDateTime - new Date()) / (1000 * 60 * 60);
  return hoursUntil >= (parseInt(process.env.BOOKING_CANCELLATION_HOURS) || 4);
});

// ── Static: Check slot availability ───────────────────────
BookingSchema.statics.isSlotAvailable = async function(turfId, date, timeSlot) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await this.findOne({
    turf: turfId,
    date: { $gte: startOfDay, $lte: endOfDay },
    'timeSlot.start': timeSlot,
    status: { $in: ['pending', 'confirmed'] }
  });

  return !existing;
};

BookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', BookingSchema);
