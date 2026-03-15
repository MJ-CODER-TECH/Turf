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
exports.initiateBooking = async (req, res) => {
  try {
    const { turfId, date, timeSlots, players } = req.body;

    // Validate input
    if (!turfId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ success: false, message: 'turfId, date, and timeSlots[] are required.' });
    }

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

    // Check availability for ALL requested slots
    for (const slot of timeSlots) {
      const isAvailable = await Booking.isSlotAvailable(turfId, bookingDate, slot.start);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: `Slot ${slot.start} is already booked. Please choose another.`
        });
      }
    }

    // Calculate amount for all slots
    const singleSlot = paymentService.calculateAmount(turf, bookingDate);
    const slotCount  = timeSlots.length;
    const amount = {
      base:     singleSlot.base * slotCount,
      taxes:    Math.round(singleSlot.base * slotCount * 0.18),
      discount: 0,
      total:    singleSlot.base * slotCount + Math.round(singleSlot.base * slotCount * 0.18)
    };

    // Create Razorpay order
    const orderResult = await paymentService.createOrder({
      amount:  amount.total,
receipt: `TZ_${Date.now()}`,
      notes: {
        turfId,
        userId:    req.user.id,
        date,
        slotCount: slotCount.toString()
      }
    });

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway error. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { debug: orderResult.error })
      });
    }

    // Create one pending booking per slot
    const bookings = await Promise.all(
      timeSlots.map(slot =>
        Booking.create({
          user:     req.user.id,
          turf:     turfId,
          date:     bookingDate,
          timeSlot: { start: slot.start, end: slot.end },
          players:  players || turf.capacity || 10,
          amount,
          status:        'pending',
          paymentStatus: 'pending',
          razorpayOrderId: orderResult.order.id,
          turfSnapshot: {
            name:       turf.name,
            location:   turf.location.area,
            city:       turf.location.city,
            sport:      turf.sport,
            ownerPhone: ''
          }
        })
      )
    );

    // Return primary booking id (first slot); confirm will handle all via orderId
    const primaryBooking = bookings[0];

    res.status(200).json({
      success: true,
      message: 'Booking initiated. Complete payment to confirm.',
      data: {
        bookingId:       primaryBooking._id,
        bookingRef:      primaryBooking.bookingId,
        allBookingIds:   bookings.map(b => b._id),
        razorpayOrderId: orderResult.order.id,
        keyId:           process.env.RAZORPAY_KEY_ID,
        amount:          amount.total,
        amountBreakdown: amount,
        turf: {
          name:     turf.name,
          sport:    turf.sport,
          location: `${turf.location.area}, ${turf.location.city}`,
        },
        date,
        slots:    timeSlots.map(s => `${s.start} – ${s.end}`),
        currency: 'INR'
      }
    });

  } catch (err) {
    logger.error(`Initiate booking error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not initiate booking.' });
  }
};

// ── @POST /bookings/confirm ────────────────────────────────
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    // Find the primary booking
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Booking already confirmed.' });
    }

    // Verify Razorpay signature
    const isValid = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      // Mark all bookings under this order as failed
      await Booking.updateMany(
        { razorpayOrderId, user: req.user.id },
        { status: 'pending', paymentStatus: 'failed' }
      );

      const user = await User.findById(req.user.id);
      await Promise.allSettled([
        emailService.sendPaymentFailed(user, booking),
        smsService.sendPaymentFailed(user.phone, booking)
      ]);

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Contact support if money was deducted.'
      });
    }

    // Confirm ALL bookings under this Razorpay order
    const allBookings = await Booking.find({ razorpayOrderId, user: req.user.id });

    const qrPayload = Buffer.from(JSON.stringify({
      orderId:  razorpayOrderId,
      turfId:   booking.turf,
      date:     booking.date,
      slots:    allBookings.map(b => b.timeSlot)
    })).toString('base64');

    await Booking.updateMany(
      { razorpayOrderId, user: req.user.id },
      {
        status:            'confirmed',
        paymentStatus:     'paid',
        paymentMethod:     paymentMethod || 'razorpay',
        razorpayPaymentId,
        razorpaySignature,
        confirmationSentAt: new Date(),
        qrCode:             qrPayload
      }
    );

    // Re-fetch updated primary booking
    const confirmedBooking = await Booking.findById(bookingId);

    // Update turf & user stats (total across all slots)
    const totalPaid = confirmedBooking.amount.total; // already includes all slots
    await Turf.findByIdAndUpdate(booking.turf, {
      $inc: { totalBookings: allBookings.length, totalRevenue: totalPaid }
    });

    const user = await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalBookings: allBookings.length, totalSpent: totalPaid }
    }, { new: true });

    const turf = await Turf.findById(booking.turf);

    // Send confirmations
    await Promise.allSettled([
      emailService.sendBookingConfirmation(confirmedBooking, user, turf),
      smsService.sendBookingConfirmed(user.phone, confirmedBooking, turf),
      Notification.create({
        user: user._id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed! 🎉',
        message: `Your booking at ${turf.name} on ${moment(confirmedBooking.date).format('DD MMM')} is confirmed. ${allBookings.length} slot${allBookings.length > 1 ? 's' : ''} booked.`,
        data: { bookingId: confirmedBooking._id, bookingRef: confirmedBooking.bookingId },
        channels: {
          inApp: { sent: true, sentAt: new Date() },
          email: { sent: true, sentAt: new Date() },
          sms:   { sent: true, sentAt: new Date() }
        }
      })
    ]);

    logger.info(`✅ Booking confirmed: ${confirmedBooking.bookingId} (${allBookings.length} slots) for user ${user.email}`);

    await confirmedBooking.populate('turf', 'name sport location amenities');

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully! Check your email and SMS.',
      data: confirmedBooking
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
        page:  parseInt(page),
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
    const canRefund   = hoursUntil >= freeCancelHours;
    const refundAmount = canRefund ? booking.amount.total : 0;

    // Process refund if eligible
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
        booking.refundStatus = 'pending';
      }
    }

    booking.status             = 'cancelled';
    booking.paymentStatus      = refundAmount > 0 ? 'refunded' : booking.paymentStatus;
    booking.cancelledBy        = req.user.id;
    booking.cancelledAt        = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.refundAmount       = refundAmount;
    if (refundId) booking.refundId = refundId;
    await booking.save();

    const [user, turf] = await Promise.all([
      User.findById(booking.user),
      Turf.findById(booking.turf)
    ]);

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
    const endOfDay   = moment.tz(date, IST).endOf('day').toDate();

    const booked = await Booking.find({
      turf:   turfId,
      date:   { $gte: bookingDate, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedTimes = booked.map(b => b.timeSlot.start);

    // Return ALL hours (06–23) so the frontend SlotGrid works correctly,
    // not just turf.defaultSlots (which may be a sparse list)
    const allHours = [];
    for (let h = 6; h < 23; h++) {
      const start = `${String(h).padStart(2, '0')}:00`;
      allHours.push(start);
    }

    const slots = allHours.map(start => ({
      start,
      available: !bookedTimes.includes(start),
      price: paymentService.calculateAmount(turf, bookingDate).base
    }));

    res.status(200).json({
      success: true,
      data: {
        date,
        turf: { id: turf._id, name: turf.name, sport: turf.sport },
        bookedSlots:    bookedTimes,          // ← frontend uses this directly
        slots,
        totalAvailable: slots.filter(s => s.available).length
      }
    });

  } catch (err) {
    logger.error(`Check availability error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not check availability.' });
  }
};

// ── @POST /bookings/webhook ───────────────────────────────
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    // Raw Buffer se string banao
    const rawBody = req.body instanceof Buffer
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    // Signature verify
    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      logger.warn('💳 Webhook: invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event   = JSON.parse(rawBody);
    const payload = event.payload;

    switch (event.event) {
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