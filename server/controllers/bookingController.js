// controllers/bookingController.js
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');
const Notification = require('../models/Notification');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

const IST = 'Asia/Kolkata';

// ── @POST /bookings/initiate ───────────────────────────────
// Step 1: Validate slot and create Razorpay order
exports.initiateBooking = async (req, res) => {
  try {
    const { turfId, date, timeSlot } = req.body;

    // Validate turf
    const turf = await Turf.findOne({ _id: turfId, isActive: true });
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found or inactive.' });

    // Parse date
    const bookingDate = moment.tz(date, IST).startOf('day').toDate();
    if (moment.tz(bookingDate, IST).isBefore(moment.tz(IST).startOf('day'))) {
      return res.status(400).json({ success: false, message: 'Cannot book for a past date.' });
    }

    // Check max advance booking (30 days)
    if (moment.tz(bookingDate, IST).diff(moment.tz(IST), 'days') > 30) {
      return res.status(400).json({ success: false, message: 'Cannot book more than 30 days in advance.' });
    }

    // Check slot availability
    const isAvailable = await Booking.isSlotAvailable(turfId, bookingDate, timeSlot);
    if (!isAvailable) {
      return res.status(409).json({ success: false, message: 'This slot is already booked. Please choose another.' });
    }

    // Calculate amount
    const amount = paymentService.calculateAmount(turf, bookingDate);

    // Create Razorpay order
    const orderResult = await paymentService.createOrder({
      amount: amount.total,
      receipt: `TZ_${req.user.id}_${Date.now()}`,
      notes: {
        turfId:   turfId,
        userId:   req.user.id,
        date:     date,
        timeSlot: timeSlot
      }
    });

    if (!orderResult.success) {
      return res.status(500).json({ success: false, message: 'Payment gateway error. Please try again.' });
    }

    // Create pending booking
    const [startH] = timeSlot.split(':').map(Number);
    const endHour = (startH + 1).toString().padStart(2, '0');
    const timeSlotEnd = `${endHour}:00`;

    const booking = await Booking.create({
      user:     req.user.id,
      turf:     turfId,
      date:     bookingDate,
      timeSlot: { start: timeSlot, end: timeSlotEnd },
      amount,
      status:   'pending',
      paymentStatus: 'pending',
      razorpayOrderId: orderResult.order.id,
      turfSnapshot: {
        name:     turf.name,
        location: turf.location.area,
        city:     turf.location.city,
        sport:    turf.sport,
        ownerPhone: ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking initiated. Complete payment to confirm.',
      data: {
        bookingId: booking._id,
        bookingRef: booking.bookingId,
        razorpayOrderId: orderResult.order.id,
        razorpayKeyId:   process.env.RAZORPAY_KEY_ID,
        amount:          amount.total,
        amountBreakdown: amount,
        turf: {
          name:     turf.name,
          sport:    turf.sport,
          location: `${turf.location.area}, ${turf.location.city}`,
        },
        date:     date,
        timeSlot: `${timeSlot} – ${timeSlotEnd}`,
        currency: 'INR'
      }
    });
  } catch (err) {
    logger.error(`Initiate booking error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not initiate booking.' });
  }
};

// ── @POST /bookings/confirm ────────────────────────────────
// Step 2: Verify Razorpay payment and confirm booking
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    // Find booking
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Booking already confirmed.' });
    }

    // Verify Razorpay signature
    const isValid = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      booking.status = 'pending';
      booking.paymentStatus = 'failed';
      await booking.save();

      const user = await User.findById(req.user.id);
      await emailService.sendPaymentFailed(user, booking);
      await smsService.sendPaymentFailed(user.phone, booking);

      return res.status(400).json({ success: false, message: 'Payment verification failed. Contact support if money was deducted.' });
    }

    // Confirm booking
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod || 'razorpay';
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    booking.confirmationSentAt = new Date();

    // Generate QR code data
    booking.qrCode = Buffer.from(JSON.stringify({
      bookingId: booking.bookingId,
      turfId: booking.turf,
      date: booking.date,
      timeSlot: booking.timeSlot
    })).toString('base64');

    await booking.save();

    // Update turf stats
    await Turf.findByIdAndUpdate(booking.turf, {
      $inc: { totalBookings: 1, totalRevenue: booking.amount.total }
    });

    // Update user stats
    const user = await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalBookings: 1, totalSpent: booking.amount.total }
    }, { new: true });

    const turf = await Turf.findById(booking.turf);

    // Send confirmations (parallel)
    await Promise.allSettled([
      emailService.sendBookingConfirmation(booking, user, turf),
      smsService.sendBookingConfirmed(user.phone, booking, turf),
      Notification.create({
        user: user._id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed! 🎉',
        message: `Your booking at ${turf.name} on ${moment(booking.date).format('DD MMM')} at ${booking.timeSlot.start} is confirmed.`,
        data: { bookingId: booking._id, bookingRef: booking.bookingId },
        channels: {
          inApp: { sent: true, sentAt: new Date() },
          email: { sent: true, sentAt: new Date() },
          sms:   { sent: true, sentAt: new Date() }
        }
      })
    ]);

    logger.info(`✅ Booking confirmed: ${booking.bookingId} for user ${user.email}`);

    await booking.populate('turf', 'name sport location amenities');

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully! Check your email and SMS.',
      data: booking
    });
  } catch (err) {
    logger.error(`Confirm booking error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not confirm booking.' });
  }
};

// ── @GET /bookings/my ─────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('turf', 'name sport location.area location.city images slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch bookings.' });
  }
};

// ── @GET /bookings/:id ────────────────────────────────────
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('turf', 'name sport location amenities images slug');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Allow: booking owner, turf owner, admin
    if (
      booking.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'owner'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch booking.' });
  }
};

// ── @POST /bookings/:id/cancel ────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    if (!['confirmed', 'pending'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }

    // Check cancellation window
    const bookingDateTime = new Date(booking.date);
    const [h] = booking.timeSlot.start.split(':');
    bookingDateTime.setHours(parseInt(h), 0, 0, 0);
    const hoursUntil = (bookingDateTime - new Date()) / (1000 * 60 * 60);

    const freeCancelHours = parseInt(process.env.BOOKING_CANCELLATION_HOURS) || 4;
    const canRefund = hoursUntil >= freeCancelHours;
    const refundAmount = canRefund ? booking.amount.total : 0;

    // Process refund if paid
    let refundId = null;
    if (booking.paymentStatus === 'paid' && refundAmount > 0 && booking.razorpayPaymentId) {
      const refundResult = await paymentService.processRefund(
        booking.razorpayPaymentId,
        refundAmount,
        { reason: req.body.reason || 'Customer cancelled' }
      );
      if (refundResult.success) {
        refundId = refundResult.refund.id;
        booking.refundStatus = 'processed';
      } else {
        booking.refundStatus = 'pending'; // Manual processing needed
      }
    }

    booking.status = 'cancelled';
    booking.paymentStatus = refundAmount > 0 ? 'refunded' : booking.paymentStatus;
    booking.cancelledBy = req.user.id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.refundAmount = refundAmount;
    if (refundId) booking.refundId = refundId;
    await booking.save();

    const [user, turf] = await Promise.all([
      User.findById(booking.user),
      Turf.findById(booking.turf)
    ]);

    // Notifications
    await Promise.allSettled([
      emailService.sendBookingCancellation(booking, user, turf, refundAmount),
      smsService.sendBookingCancelled(user.phone, booking, refundAmount),
      refundAmount > 0 && smsService.sendRefundProcessed(user.phone, refundAmount, booking.bookingId),
      Notification.create({
        user: user._id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: refundAmount > 0
          ? `Your booking at ${turf.name} has been cancelled. Refund of ₹${refundAmount} will be processed in 5-7 days.`
          : `Your booking at ${turf.name} has been cancelled.`,
        data: { bookingId: booking._id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: canRefund
        ? `Booking cancelled. Refund of ₹${refundAmount} will be processed in 5-7 business days.`
        : 'Booking cancelled. No refund applicable (within 4-hour window).',
      data: { bookingId: booking.bookingId, refundAmount, canRefund }
    });
  } catch (err) {
    logger.error(`Cancel booking error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not cancel booking.' });
  }
};

// ── @GET /bookings/availability ───────────────────────────
exports.checkAvailability = async (req, res) => {
  try {
    const { turfId, date } = req.query;
    if (!turfId || !date) {
      return res.status(400).json({ success: false, message: 'turfId and date are required.' });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    const bookingDate = moment.tz(date, IST).startOf('day').toDate();
    const endOfDay = moment.tz(date, IST).endOf('day').toDate();

    const bookedSlots = await Booking.find({
      turf: turfId,
      date: { $gte: bookingDate, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedTimes = bookedSlots.map(b => b.timeSlot.start);
    const available = turf.defaultSlots.map(slot => ({
      time: slot,
      available: !bookedTimes.includes(slot),
      price: paymentService.calculateAmount(turf, bookingDate).base
    }));

    res.status(200).json({
      success: true,
      data: {
        date,
        turf: { id: turf._id, name: turf.name, sport: turf.sport },
        slots: available,
        totalAvailable: available.filter(s => s.available).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not check availability.' });
  }
};

// ── @POST /bookings/webhook ───────────────────────────────
// Razorpay webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = paymentService.verifyWebhook(req.body, signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured':
        logger.info(`💳 Webhook: payment captured ${payload.payment?.entity?.id}`);
        break;
      case 'payment.failed':
        logger.warn(`💳 Webhook: payment failed ${payload.payment?.entity?.id}`);
        break;
      case 'refund.processed':
        logger.info(`💳 Webhook: refund processed ${payload.refund?.entity?.id}`);
        break;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    res.status(500).json({ success: false });
  }
};
