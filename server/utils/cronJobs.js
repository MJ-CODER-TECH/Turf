// utils/cronJobs.js
const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Turf = require('../models/Turf');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const logger = require('./logger');
const moment = require('moment-timezone');

const IST = 'Asia/Kolkata';

// ── 24-hour reminder (runs at 9 AM IST daily) ─────────────
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('🕐 Running 24h booking reminder job...');
    const tomorrow = moment.tz(IST).add(1, 'day');
    const start = tomorrow.clone().startOf('day').toDate();
    const end = tomorrow.clone().endOf('day').toDate();

    const bookings = await Booking.find({
      status: 'confirmed',
      date: { $gte: start, $lte: end },
      reminder24hSent: false
    }).populate('user', 'name email phone').populate('turf', 'name sport location');

    logger.info(`📋 Found ${bookings.length} bookings for 24h reminders`);

    for (const booking of bookings) {
      try {
        await Promise.allSettled([
          emailService.sendBookingReminder(booking, booking.user, booking.turf, 24),
          smsService.sendBookingReminder(booking.user.phone, booking, booking.turf, 24),
          Notification.create({
            user: booking.user._id,
            type: 'booking_reminder',
            title: '⏰ Match Tomorrow!',
            message: `Your ${booking.turf.sport} session at ${booking.turf.name} is tomorrow at ${booking.timeSlot.start}.`,
            data: { bookingId: booking._id }
          })
        ]);
        booking.reminder24hSent = true;
        await booking.save();
        logger.info(`✅ 24h reminder sent for booking ${booking.bookingId}`);
      } catch (err) {
        logger.error(`Failed 24h reminder for ${booking.bookingId}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`24h reminder job failed: ${err.message}`);
  }
}, { timezone: 'Asia/Kolkata' });

// ── 1-hour reminder (runs every hour at :00) ──────────────
cron.schedule('0 * * * *', async () => {
  try {
    const inOneHour = moment.tz(IST).add(1, 'hour');
    const slotTime = inOneHour.format('HH:00');
    const bookingDate = inOneHour.clone().startOf('day').toDate();
    const bookingDateEnd = inOneHour.clone().endOf('day').toDate();

    const bookings = await Booking.find({
      status: 'confirmed',
      date: { $gte: bookingDate, $lte: bookingDateEnd },
      'timeSlot.start': slotTime,
      reminder1hSent: false
    }).populate('user', 'name email phone').populate('turf', 'name sport location');

    for (const booking of bookings) {
      try {
        await Promise.allSettled([
          emailService.sendBookingReminder(booking, booking.user, booking.turf, 1),
          smsService.sendBookingReminder(booking.user.phone, booking, booking.turf, 1),
          Notification.create({
            user: booking.user._id,
            type: 'booking_reminder',
            title: '🏃 Starting in 1 Hour!',
            message: `Get ready! Your ${booking.turf.sport} session at ${booking.turf.name} starts at ${booking.timeSlot.start}.`,
            data: { bookingId: booking._id }
          })
        ]);
        booking.reminder1hSent = true;
        await booking.save();
        logger.info(`✅ 1h reminder sent for booking ${booking.bookingId}`);
      } catch (err) {
        logger.error(`Failed 1h reminder for ${booking.bookingId}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`1h reminder job failed: ${err.message}`);
  }
}, { timezone: 'Asia/Kolkata' });

// ── Mark completed bookings (runs at midnight) ─────────────
cron.schedule('5 0 * * *', async () => {
  try {
    logger.info('🕛 Running mark-completed job...');
    const yesterday = moment.tz(IST).subtract(1, 'day');
    const start = yesterday.clone().startOf('day').toDate();
    const end = yesterday.clone().endOf('day').toDate();

    const result = await Booking.updateMany(
      { status: 'confirmed', date: { $gte: start, $lte: end } },
      { status: 'completed' }
    );
    logger.info(`✅ Marked ${result.modifiedCount} bookings as completed`);
  } catch (err) {
    logger.error(`Mark-completed job failed: ${err.message}`);
  }
}, { timezone: 'Asia/Kolkata' });

// ── Cancel expired pending bookings (runs every 15 mins) ──
cron.schedule('*/15 * * * *', async () => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await Booking.updateMany(
      { status: 'pending', paymentStatus: 'pending', createdAt: { $lte: fifteenMinsAgo } },
      { status: 'cancelled', cancellationReason: 'Payment timeout - auto cancelled' }
    );
    if (result.modifiedCount > 0) {
      logger.info(`🗑 Auto-cancelled ${result.modifiedCount} expired pending bookings`);
    }
  } catch (err) {
    logger.error(`Auto-cancel job failed: ${err.message}`);
  }
});

logger.info('⏰ Cron jobs initialized');
module.exports = {};
