// models/PendingUser.js
// Temporarily holds registrations until email is verified.
// Real User document is only created AFTER verification.
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const PendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  favouriteSport: {
    type: String,
    enum: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Box Cricket', 'Other'],
    default: 'Football',
  },
  emailVerifyToken:  { type: String, select: false },
  emailVerifyExpire: { type: Date,   select: false },

  // Auto-delete unverified records after 24h
  createdAt: {
    type: Date,
    default: Date.now,
    expires: parseInt(process.env.EMAIL_VERIFY_EXPIRE_HOURS || 24) * 3600, // TTL index
  },
});

// Hash password before saving
PendingUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate email verification token
PendingUserSchema.methods.generateEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = new Date(
    Date.now() + parseInt(process.env.EMAIL_VERIFY_EXPIRE_HOURS || 24) * 60 * 60 * 1000
  );
  return token; // Return unhashed token (sent in email)
};

module.exports = mongoose.model('PendingUser', PendingUserSchema);