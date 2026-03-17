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

    // ✅ FIX 1: Past slots block karo
    const nowIST  = moment.tz(IST);
    const isToday = moment.tz(bookingDate, IST).isSame(nowIST, 'day');

    for (const slot of timeSlots) {
      if (isToday) {
        const [slotHour] = slot.start.split(':').map(Number);
        const slotDateTime = moment.tz(bookingDate, IST).hour(slotHour).minute(0).second(0);
        if (slotDateTime.isBefore(nowIST)) {
          return res.status(400).json({
            success: false,
            message: `Slot ${slot.start} has already passed. Please select a future slot.`
          });
        }
      }
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

    // Calculate amount for ALL slots combined
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

    // ✅ FIX 2: Database mein KUCH SAVE NAHI — sirf Razorpay order return karo
    // Booking tabhi create hogi jab payment confirm ho (/confirm endpoint pe)
    res.status(200).json({
      success: true,
      message: 'Order created. Complete payment to confirm your booking.',
      data: {
        razorpayOrderId: orderResult.order.id,
        keyId:           process.env.RAZORPAY_KEY_ID,
        amount:          amount.total,
        amountBreakdown: amount,
        // ✅ Booking banane ke liye zaroori sab kuch yahan bhej do
        // Frontend Razorpay success handler mein inhe /confirm ko dega
        bookingMeta: {
          turfId,
          date,
          timeSlots,
          players:  players || turf.capacity || 10,
          slotCount,
        },
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
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
      bookingMeta,       // ✅ FIX 2: ab yahan aata hai booking ka saara data
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment details are required.' });
    }

    if (!bookingMeta?.turfId || !bookingMeta?.date || !bookingMeta?.timeSlots) {
      return res.status(400).json({ success: false, message: 'Booking details are required.' });
    }

    // Duplicate confirm guard — same orderId pe dobara booking nahi banegi
    const existingBooking = await Booking.findOne({ razorpayOrderId });
    if (existingBooking) {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed.',
        data: existingBooking
      });
    }

    // ✅ Signature verify karo PEHLE — invalid pe DB touch nahi hoga
    const isValid = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      const user = await User.findById(req.user.id);
      await Promise.allSettled([
        emailService.sendPaymentFailed(user, { amount: bookingMeta }),
        smsService.sendPaymentFailed(user.phone, { amount: bookingMeta })
      ]);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Contact support if money was deducted.'
      });
    }

    // ✅ Signature valid — ab booking create karo
    const turf = await Turf.findById(bookingMeta.turfId);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found.' });

    const bookingDate = moment.tz(bookingMeta.date, IST).startOf('day').toDate();
    const slotCount   = bookingMeta.timeSlots.length;

    // Amount server pe recalculate karo (frontend pe trust mat karo)
    const singleSlot = paymentService.calculateAmount(turf, bookingDate);
    const amount = {
      base:     singleSlot.base * slotCount,
      taxes:    Math.round(singleSlot.base * slotCount * 0.18),
      discount: 0,
      total:    singleSlot.base * slotCount + Math.round(singleSlot.base * slotCount * 0.18)
    };

    // Race condition check — payment ke beech mein kisi ne slot le liya?
    for (const slot of bookingMeta.timeSlots) {
      const isAvailable = await Booking.isSlotAvailable(bookingMeta.turfId, bookingDate, slot.start);
      if (!isAvailable) {
        logger.error(`Race condition: slot ${slot.start} taken after payment ${razorpayPaymentId}`);
        return res.status(409).json({
          success: false,
          message: `Slot ${slot.start} was just booked by someone else. Please contact support with Payment ID: ${razorpayPaymentId} for a full refund.`
        });
      }
    }

    const qrPayload = Buffer.from(JSON.stringify({
      orderId:  razorpayOrderId,
      turfId:   bookingMeta.turfId,
      date:     bookingMeta.date,
      slots:    bookingMeta.timeSlots
    })).toString('base64');

    // ✅ Booking seedha confirmed + paid status ke saath create hogi
    const booking = await Booking.create({
      user:      req.user.id,
      turf:      bookingMeta.turfId,
      date:      bookingDate,
      timeSlots: bookingMeta.timeSlots,
      duration:  slotCount * 60,
      players:   bookingMeta.players || turf.capacity || 10,
      amount,
      status:            'confirmed',  // ← pending kabhi nahi hogi
      paymentStatus:     'paid',       // ← seedha paid
      paymentMethod:     paymentMethod || 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      confirmationSentAt: new Date(),
      qrCode:             qrPayload,
      turfSnapshot: {
        name:       turf.name,
        location:   turf.location.area,
        city:       turf.location.city,
        sport:      turf.sport,
        ownerPhone: ''
      }
    });

    // Stats update
    const user = await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalBookings: slotCount, totalSpent: amount.total }
    }, { new: true });

    await Turf.findByIdAndUpdate(bookingMeta.turfId, {
      $inc: { totalBookings: slotCount, totalRevenue: amount.total }
    });

    // Send confirmations
    await Promise.allSettled([
      emailService.sendBookingConfirmation(booking, user, turf),
      smsService.sendBookingConfirmed(user.phone, booking, turf),
      Notification.create({
        user: user._id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed! 🎉',
        message: `Your booking at ${turf.name} on ${moment(booking.date).format('DD MMM')} is confirmed. ${slotCount} slot${slotCount > 1 ? 's' : ''} booked.`,
        data: { bookingId: booking._id, bookingRef: booking.bookingId },
        channels: {
          inApp: { sent: true, sentAt: new Date() },
          email: { sent: true, sentAt: new Date() },
          sms:   { sent: true, sentAt: new Date() }
        }
      })
    ]);

    logger.info(`✅ Booking confirmed: ${booking.bookingId} (${slotCount} slots) for user ${user.email}`);

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

    // ✅ FIX: createdAt se calculate karo — booking karne ke 4 hours andar cancel = refund
    const hoursSinceBooked = moment.tz(IST).diff(
      moment.tz(booking.createdAt, IST),
      'hours',
      true  // decimal precision
    );

    const freeCancelHours = parseInt(process.env.BOOKING_CANCELLATION_HOURS) || 4;
    const canRefund    = hoursSinceBooked < freeCancelHours;  // ✅ 4 hours andar cancel = refund
    const refundAmount = canRefund ? booking.amount.total : 0;

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

    // ✅ refundStatus hamesha explicitly set karo
    if (refundAmount === 0) {
      booking.refundStatus = 'none';
    } else if (!booking.refundStatus || booking.refundStatus === '') {
      booking.refundStatus = 'pending';
    }

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
          : `Your booking at ${turf.name} has been cancelled. No refund applicable.`,
        data: { bookingId: booking._id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: canRefund
        ? `Booking cancelled. Refund of ₹${refundAmount} will be processed in 5-7 business days.`
        : 'Booking cancelled. No refund applicable (4-hour window has passed).',
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

    // ✅ FIX 2: Ab sirf 'confirmed' bookings check karo — pending exist hi nahi karte
    const booked = await Booking.find({
      turf:   turfId,
      date:   { $gte: bookingDate, $lte: endOfDay },
      status: { $in: ['confirmed'] }
    }).select('timeSlots timeSlot');

    const bookedTimes = booked.flatMap(b => {
      if (b.timeSlots && b.timeSlots.length > 0) return b.timeSlots.map(s => s.start);
      if (b.timeSlot?.start) return [b.timeSlot.start];
      return [];
    });

    // ✅ FIX 1: Past slots automatically unavailable mark karo
    const nowIST  = moment.tz(IST);
    const isToday = moment.tz(bookingDate, IST).isSame(nowIST, 'day');

    const allHours = [];
    for (let h = 6; h < 23; h++) {
      allHours.push(`${String(h).padStart(2, '0')}:00`);
    }

    const slots = allHours.map(start => {
      const isBooked = bookedTimes.includes(start);
      let isPast = false;

      if (isToday) {
        const [slotHour] = start.split(':').map(Number);
        const slotTime = moment.tz(bookingDate, IST).hour(slotHour).minute(0).second(0);
        isPast = slotTime.isBefore(nowIST);
      }

      return {
        start,
        available: !isBooked && !isPast,
        isPast,
        price: paymentService.calculateAmount(turf, bookingDate).base
      };
    });

    // Frontend ko unavailable slots bhejo (booked + past dono)
    const unavailableSlots = slots.filter(s => !s.available).map(s => s.start);

    res.status(200).json({
      success: true,
      data: {
        date,
        turf: { id: turf._id, name: turf.name, sport: turf.sport },
        bookedSlots:    unavailableSlots,
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

    if (!signature) {
      logger.warn('💳 Webhook: missing signature header');
      return res.status(400).json({ success: false, message: 'Missing signature.' });
    }

    const rawBody = req.body instanceof Buffer
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      logger.warn('💳 Webhook: invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const payload = event.payload;

    switch (event.event) {

      // ── PAYMENT CAPTURED ────────────────────────────────
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        logger.info(`💳 Webhook: payment captured ${payment?.id}`);

        if (payment?.id) {
          await Booking.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            { paymentStatus: 'paid' }
          );
        }
        break;
      }

      // ── PAYMENT FAILED ──────────────────────────────────
      case 'payment.failed': {
        const payment = payload.payment?.entity;
        logger.warn(`💳 Webhook: payment failed ${payment?.id}`);

        if (payment?.order_id) {
          await Booking.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            { paymentStatus: 'failed', status: 'cancelled' }
          );
        }
        break;
      }

      // ── REFUND PROCESSED ────────────────────────────────
      case 'refund.processed': {
        const refund = payload.refund?.entity;
        logger.info(`💳 Webhook: refund processed ${refund?.id}`);

        if (refund?.payment_id) {
          const updated = await Booking.findOneAndUpdate(
            { razorpayPaymentId: refund.payment_id },
            {
              refundStatus: 'processed',
              refundId:     refund.id,
              paymentStatus: 'refunded',
            },
            { new: true }
          );

          if (updated) {
            logger.info(`💳 Refund DB updated: booking ${updated.bookingId}, refund ${refund.id}`);
          } else {
            logger.warn(`💳 Refund webhook: no booking found for payment ${refund.payment_id}`);
          }
        }
        break;
      }

      // ── REFUND FAILED ───────────────────────────────────
      case 'refund.failed': {
        const refund = payload.refund?.entity;
        logger.warn(`💳 Webhook: refund failed ${refund?.id}`);

        if (refund?.payment_id) {
          await Booking.findOneAndUpdate(
            { razorpayPaymentId: refund.payment_id },
            { refundStatus: 'failed' }
          );
          logger.warn(`💳 Refund marked failed in DB for payment ${refund.payment_id}`);
        }
        break;
      }

      default:
        logger.info(`💳 Webhook: unhandled event ${event.event}`);
    }

    // Razorpay expects 200 quickly — always respond success after processing
    return res.status(200).json({ success: true });

  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    // Still return 200 — agar 500 bheja toh Razorpay retry karega
    return res.status(200).json({ success: true });
  }
};


// ── @GET /bookings/:id/refund-status ─────────────────────
exports.getRefundStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .select('user refundAmount refundStatus refundId cancelledAt paymentStatus bookingId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // ✅ Razorpay se live status fetch karo agar refundId hai
    let liveRefundStatus = null;
    if (booking.refundId && booking.refundStatus !== 'processed') {
      try {
        const result = await paymentService.getRazorpayRefundStatus(booking.refundId);
        if (result.success && result.status) {
          liveRefundStatus = result.status; // 'processed' | 'pending' | 'failed'

          // DB sync karo agar status change hua
          if (liveRefundStatus !== booking.refundStatus) {
            await Booking.findByIdAndUpdate(booking._id, { refundStatus: liveRefundStatus });
            booking.refundStatus = liveRefundStatus;
          }
        }
      } catch (e) {
        logger.warn(`Could not fetch live refund status for ${booking.refundId}: ${e.message}`);
        // fail silently — DB value use karenge
      }
    }

    return res.json({
      success: true,
      data: {
        bookingId:    booking.bookingId,
        refundAmount: booking.refundAmount,
        refundStatus: booking.refundStatus || 'none',
        refundId:     booking.refundId     || null,
        paymentStatus: booking.paymentStatus,
        cancelledAt:  booking.cancelledAt,
      }
    });

  } catch (err) {
    logger.error(`Refund status error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};