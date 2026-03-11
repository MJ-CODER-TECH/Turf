// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['booking_confirmed','booking_cancelled','booking_reminder','payment_success',
           'payment_failed','refund_processed','review_reminder','promo','system','otp'],
    required: true
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead:  { type: Boolean, default: false, index: true },
  channels: {
    inApp: { sent: Boolean, sentAt: Date },
    email: { sent: Boolean, sentAt: Date },
    sms:   { sent: Boolean, sentAt: Date },
    push:  { sent: Boolean, sentAt: Date }
  }
}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
