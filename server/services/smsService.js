// services/smsService.js
const logger = require('../utils/logger');

// Lazy-load Twilio client (only when needed)
let twilioClient = null;
const getTwilioClient = () => {
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

// ── Format Indian Phone ────────────────────────────────────
const formatIndianPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
};

// ── Core Send SMS ──────────────────────────────────────────
const sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('AC')) {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 [DEV] SMS to ${to}: ${message}`);
        return { success: true, sid: 'DEV_MODE', dev: true };
      }
    }

    const client = getTwilioClient();
    const formattedTo = formatIndianPhone(to);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });

    logger.info(`📱 SMS sent to ${formattedTo}: SID=${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`📱 SMS failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Templates ──────────────────────────────────────────────
const SMS_TEMPLATES = {

  otp: (otp) =>
    `${otp} is your TurfZone OTP. Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes. DO NOT share this with anyone. - TurfZone`,

  bookingConfirmed: (booking, turf) =>
    `✅ Booking Confirmed!\nID: ${booking.bookingId}\nTurf: ${turf.name}\nDate: ${new Date(booking.date).toLocaleDateString('en-IN')}\nTime: ${booking.timeSlot.start}-${booking.timeSlot.end}\nAmt: ₹${booking.amount.total}\nShow this SMS at gate.\n- TurfZone`,

  bookingCancelled: (booking, refund) =>
    `❌ Booking ${booking.bookingId} cancelled.${refund > 0 ? ` Refund of ₹${refund} will be processed in 5-7 days.` : ''} Book again at turfzone.in - TurfZone`,

  bookingReminder24h: (booking, turf) =>
    `⏰ Reminder: Your ${turf.sport} session at ${turf.name} is TOMORROW at ${booking.timeSlot.start}. Address: ${turf.location.area}, ${turf.location.city}. Booking ID: ${booking.bookingId} - TurfZone`,

  bookingReminder1h: (booking, turf) =>
    `🏃 Starting in 1 HOUR! ${turf.name} - ${booking.timeSlot.start}. Address: ${turf.location.area}. ID: ${booking.bookingId}. Have a great game! - TurfZone`,

  paymentSuccess: (booking) =>
    `💳 Payment of ₹${booking.amount.total} received for booking ${booking.bookingId}. See you on the field! - TurfZone`,

  paymentFailed: (booking) =>
    `⚠️ Payment FAILED for booking ${booking.bookingId}. Amount: ₹${booking.amount.total}. Retry at turfzone.in within 15 mins or slot will be released. - TurfZone`,

  refundProcessed: (amount, bookingId) =>
    `✅ Refund of ₹${amount} for booking ${bookingId} has been processed. Will reflect in 5-7 business days. - TurfZone`,

  welcome: (name) =>
    `Welcome to TurfZone, ${name}! 🎉 Book premium sports turfs instantly across Maharashtra. Download app or visit turfzone.in - TurfZone`,
};

// ── Convenience Functions ──────────────────────────────────
module.exports = {
  sendSMS,
  SMS_TEMPLATES,

  sendOTP: (phone, otp) =>
    sendSMS(phone, SMS_TEMPLATES.otp(otp)),

  sendBookingConfirmed: (phone, booking, turf) =>
    sendSMS(phone, SMS_TEMPLATES.bookingConfirmed(booking, turf)),

  sendBookingCancelled: (phone, booking, refund) =>
    sendSMS(phone, SMS_TEMPLATES.bookingCancelled(booking, refund)),

  sendBookingReminder: (phone, booking, turf, hours) =>
    sendSMS(phone, hours === 24
      ? SMS_TEMPLATES.bookingReminder24h(booking, turf)
      : SMS_TEMPLATES.bookingReminder1h(booking, turf)),

  sendPaymentSuccess: (phone, booking) =>
    sendSMS(phone, SMS_TEMPLATES.paymentSuccess(booking)),

  sendPaymentFailed: (phone, booking) =>
    sendSMS(phone, SMS_TEMPLATES.paymentFailed(booking)),

  sendRefundProcessed: (phone, amount, bookingId) =>
    sendSMS(phone, SMS_TEMPLATES.refundProcessed(amount, bookingId)),

  sendWelcomeSMS: (phone, name) =>
    sendSMS(phone, SMS_TEMPLATES.welcome(name)),
};
