// models/Booking.js
const mongoose = require('mongoose');

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

  // Snapshot of turf details at booking time (in case turf info changes later)
  turfSnapshot: {
    name:       String,
    location:   String,
    city:       String,
    sport:      String,
    ownerPhone: String
  },

  date: {
    type: Date,
    required: [true, 'Booking date is required'],
    index: true
  },

  // ✅ FIX: timeSlot (single) → timeSlots (array)
  // Ab ek booking mein multiple slots store ho sakti hain
  timeSlots: [
    {
      start: { type: String, required: true },  // "06:00"
      end:   { type: String, required: true },  // "07:00"
    }
  ],

  // ✅ Backward compatibility virtual: purana code jo timeSlot.start use karta hai
  // wo bhi kaam karta rahega (e.g. email templates, admin panel)

  duration: { type: Number, default: 60 },   // total minutes (slotCount * 60)

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
  cancelledBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt:        Date,
  cancellationReason: String,
  refundAmount:       { type: Number, default: 0 },
  refundStatus:       { type: String, enum: ['pending', 'processed', 'failed', ''], default: '' },
  refundId:           String,

  // QR Code for entry
  qrCode: String,

  // Notes
  userNote:  String,
  adminNote: String,

  // Reminders sent
  reminder24hSent: { type: Boolean, default: false },
  reminder1hSent:  { type: Boolean, default: false },

  // Confirmation
  confirmationSentAt: Date,
  smsSentAt:          Date,

  // Rating
  hasReviewed: { type: Boolean, default: false },

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
// ✅ FIX: index bhi timeSlots.start pe update kiya
BookingSchema.index({ date: 1, turf: 1, 'timeSlots.start': 1 });
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ createdAt: -1 });

// ── Virtual: timeSlot (backward compatibility) ─────────────
// Purana code jo booking.timeSlot.start use karta hai wo bhi kaam karega
// e.g. email templates, admin panel, old API consumers
BookingSchema.virtual('timeSlot').get(function() {
  if (this.timeSlots && this.timeSlots.length > 0) {
    return this.timeSlots[0];
  }
  return null;
});

// ── Virtual: isUpcoming ───────────────────────────────────
BookingSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date() && this.status === 'confirmed';
});

// ── Virtual: canCancel ────────────────────────────────────
BookingSchema.virtual('canCancel').get(function() {
  if (!['confirmed', 'pending'].includes(this.status)) return false;
  // ✅ FIX: timeSlots[0] use karo (earliest slot)
  const firstSlot = this.timeSlots?.[0];
  if (!firstSlot?.start) return false;
  const bookingDateTime = new Date(this.date);
  const [h, m] = firstSlot.start.split(':');
  bookingDateTime.setHours(parseInt(h), parseInt(m || 0), 0, 0);
  const hoursUntil = (bookingDateTime - new Date()) / (1000 * 60 * 60);
  return hoursUntil >= (parseInt(process.env.BOOKING_CANCELLATION_HOURS) || 4);
});

// ── Virtual: slotCount (convenience) ─────────────────────
BookingSchema.virtual('slotCount').get(function() {
  return this.timeSlots?.length || 1;
});

// ── Static: Check slot availability ───────────────────────
// ✅ FIX: ab timeSlots array mein check karo
// Backward compat ke liye dono check hain
BookingSchema.statics.isSlotAvailable = async function(turfId, date, slotStart) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await this.findOne({
    turf: turfId,
    date: { $gte: startOfDay, $lte: endOfDay },
    // ✅ FIX: timeSlots.start array field mein check karo
    'timeSlots.start': slotStart,
    status: { $in: ['pending', 'confirmed'] }
  });

  return !existing;
};

BookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', BookingSchema);