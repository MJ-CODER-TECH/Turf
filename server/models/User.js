// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password in queries
  },
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user'
  },
  avatar: {
    public_id: String,
    url: { type: String, default: '' }
  },
  favouriteSport: {
    type: String,
    enum: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Box Cricket', 'Other'],
    default: 'Football'
  },
  favouriteTurfs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf'
  }],
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },

  // OTP for phone verification
  phoneOTP:          { type: String, select: false },
  phoneOTPExpire:    { type: Date,   select: false },

  // Email verification token
  emailVerifyToken:  { type: String, select: false },
  emailVerifyExpire: { type: Date,   select: false },

  // Password reset
  resetPasswordToken:  { type: String, select: false },
  resetPasswordExpire: { type: Date,   select: false },

  // Refresh token
  refreshToken: { type: String, select: false },

  // Push notification token (for mobile)
  fcmToken: { type: String, default: '' },

  // Login history
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },

  // Stats
  totalBookings: { type: Number, default: 0 },
  totalSpent:    { type: Number, default: 0 },

  // Wallet (for refunds)
  walletBalance: { type: Number, default: 0 },

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// ── Pre-save: Hash password ────────────────────────────────
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Method: Compare password ───────────────────────────────
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Method: Generate JWT ───────────────────────────────────
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ── Method: Generate Refresh Token ────────────────────────
UserSchema.methods.getRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// ── Method: Generate Phone OTP ────────────────────────────
UserSchema.methods.generatePhoneOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOTP = otp;
  this.phoneOTPExpire = Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000;
  return otp;
};

// ── Method: Generate Email Verify Token ───────────────────
UserSchema.methods.generateEmailVerifyToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// ── Method: Generate Password Reset Token ─────────────────
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// ── Virtual: Full avatar URL ───────────────────────────────
UserSchema.virtual('avatarUrl').get(function() {
  return this.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=00E87A&color=000`;
});

// ── toJSON: Remove sensitive fields ───────────────────────
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.phoneOTP;
    delete ret.phoneOTPExpire;
    delete ret.emailVerifyToken;
    delete ret.resetPasswordToken;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
