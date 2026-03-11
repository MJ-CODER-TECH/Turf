// services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ── Create Transporter ─────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

// ── Base Email Template ────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>TurfZone</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#07090A; font-family:'Segoe UI',Arial,sans-serif; color:#EDF5F0; }
    .wrapper { max-width:600px; margin:0 auto; padding:20px; }
    .header { background:#0D1210; padding:28px 32px; text-align:center; border-bottom:2px solid #00E87A; }
    .logo { font-size:2rem; font-weight:900; color:#00E87A; letter-spacing:3px; }
    .logo span { color:#fff; }
    .body { background:#131916; padding:32px; border:1px solid rgba(0,232,122,0.1); margin-top:2px; }
    .footer { background:#0D1210; padding:20px 32px; text-align:center; font-size:12px; color:#6B8B76; margin-top:2px; }
    .btn { display:inline-block; background:#00E87A; color:#000; padding:14px 32px; font-weight:700; font-size:15px; text-decoration:none; margin:20px 0; letter-spacing:0.5px; }
    .highlight { color:#00E87A; font-weight:700; }
    .box { background:#07090A; border:1px solid rgba(0,232,122,0.15); padding:20px; margin:18px 0; border-radius:2px; }
    .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:14px; }
    .row:last-child { border-bottom:none; }
    .label { color:#6B8B76; }
    .value { font-weight:600; }
    h2 { font-size:22px; margin-bottom:14px; }
    p { color:#B0C4B8; line-height:1.7; font-size:14px; margin-bottom:12px; }
    .divider { height:1px; background:rgba(0,232,122,0.08); margin:20px 0; }
    .badge { display:inline-block; background:rgba(0,232,122,0.1); border:1px solid rgba(0,232,122,0.3); color:#00E87A; padding:4px 14px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
    .warning { color:#FFD63A; }
    .error { color:#FF4D4D; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Turf<span>Zone</span></div>
      <div style="color:#6B8B76;font-size:12px;margin-top:6px;letter-spacing:1px;">INDIA'S FASTEST TURF BOOKING PLATFORM</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TurfZone. All rights reserved.</p>
      <p style="margin-top:6px;">📧 support@turfzone.in &nbsp;|&nbsp; 📞 +91 99999 99999</p>
      <p style="margin-top:6px;font-size:11px;">You're receiving this because you have an account on TurfZone.</p>
    </div>
  </div>
</body>
</html>`;

// ── Templates ──────────────────────────────────────────────
const templates = {

  welcome: (user) => baseTemplate(`
    <h2>Welcome to TurfZone, <span class="highlight">${user.name}!</span> 🎉</h2>
    <p>We're thrilled to have you on board. You can now book premium sports turfs across Maharashtra — instantly and effortlessly.</p>
    <div class="box">
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:36px;margin-bottom:8px;">⚽ 🏏 🏸 🏀</div>
        <div style="font-size:18px;font-weight:700;color:#00E87A;">50+ Premium Turfs</div>
        <div style="color:#6B8B76;font-size:13px;margin-top:4px;">Football · Cricket · Badminton · Basketball · Tennis</div>
      </div>
    </div>
    <p>Verify your email to unlock all features and get ₹50 off your first booking!</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/verify-email?token=VERIFY_TOKEN" class="btn">Verify Email →</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px;color:#6B8B76;">If you didn't create this account, please ignore this email.</p>
  `),

  emailVerification: (user, verifyUrl) => baseTemplate(`
    <h2>Verify Your Email</h2>
    <p>Hi <span class="highlight">${user.name}</span>, please verify your email address to complete your registration.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" class="btn">Verify Email Address →</a>
    </div>
    <div class="box">
      <p style="font-size:13px;color:#6B8B76;margin:0;">Link expires in <strong style="color:#FFD63A;">24 hours</strong>. If you can't click the button, copy this URL:</p>
      <p style="font-size:11px;word-break:break-all;color:#6B8B76;margin-top:8px;">${verifyUrl}</p>
    </div>
    <p style="font-size:12px;color:#6B8B76;">If you didn't create a TurfZone account, please ignore this email.</p>
  `),

  bookingConfirmation: (booking, user, turf) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">🎉</div>
      <h2 style="color:#00E87A;font-size:26px;">Booking Confirmed!</h2>
      <span class="badge">Confirmed</span>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your turf booking is confirmed! Show this email (or SMS) at the venue.</p>
    <div class="box">
      <div style="text-align:center;margin-bottom:16px;font-family:monospace;font-size:20px;font-weight:700;color:#00E87A;letter-spacing:3px;">${booking.bookingId}</div>
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Sport</span><span class="value">${turf.sport}</span></div>
      <div class="row"><span class="label">Location</span><span class="value">${turf.location.area}, ${turf.location.city}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
      <div class="row"><span class="label">Duration</span><span class="value">${booking.duration} minutes</span></div>
    </div>
    <div class="box">
      <div class="row"><span class="label">Amount Paid</span><span class="value highlight">₹${booking.amount.total}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">${booking.paymentMethod || 'Online'}</span></div>
    </div>
    <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);padding:14px;margin:16px 0;">
      <p style="color:#FFD63A;margin:0;font-size:13px;">⏰ Free cancellation up to <strong>4 hours before</strong> your slot. Cancel from your dashboard anytime.</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}" class="btn">View Booking Details →</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px;color:#6B8B76;">Need help? Contact us at support@turfzone.in or call +91 99999 99999</p>
  `),

  bookingCancellation: (booking, user, turf, refundAmount) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">❌</div>
      <h2>Booking Cancelled</h2>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your booking has been cancelled as requested.</p>
    <div class="box">
      <div class="row"><span class="label">Booking ID</span><span class="value">${booking.bookingId}</span></div>
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN')}</span></div>
      <div class="row"><span class="label">Time Slot</span><span class="value">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
    </div>
    ${refundAmount > 0 ? `
    <div class="box" style="border-color:rgba(0,232,122,0.3);">
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:24px;color:#00E87A;font-weight:700;">₹${refundAmount}</div>
        <div style="color:#6B8B76;font-size:13px;margin-top:4px;">Refund will be processed in <strong style="color:#fff;">5-7 business days</strong></div>
      </div>
    </div>` : '<p class="warning">No refund applicable as cancellation was within the free cancellation window.</p>'}
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL}/turfs" class="btn">Book Another Turf →</a>
    </div>
  `),

  bookingReminder: (booking, user, turf, hoursUntil) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">⏰</div>
      <h2>Match Reminder!</h2>
      <p style="color:#00E87A;font-size:16px;font-weight:600;">Your turf session is ${hoursUntil === 24 ? 'tomorrow' : 'in 1 hour'}!</p>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, get ready — your turf session is coming up!</p>
    <div class="box">
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN', {weekday:'long',month:'long',day:'numeric'})}</span></div>
      <div class="row"><span class="label">Time</span><span class="value highlight">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
      <div class="row"><span class="label">Location</span><span class="value">${turf.location.address}, ${turf.location.city}</span></div>
      <div class="row"><span class="label">Booking ID</span><span class="value" style="font-family:monospace;">${booking.bookingId}</span></div>
    </div>
    <div style="background:rgba(0,232,122,0.05);border:1px solid rgba(0,232,122,0.15);padding:14px;margin:16px 0;">
      <p style="margin:0;font-size:13px;">📍 <a href="${turf.location.googleMapsUrl || '#'}" style="color:#00E87A;">Get Directions →</a></p>
    </div>
    <p style="font-size:12px;color:#6B8B76;">If you cannot attend, please cancel at least 4 hours before to get a full refund.</p>
  `),

  passwordReset: (user, resetUrl) => baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi <span class="highlight">${user.name}</span>, we received a request to reset your TurfZone password.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn">Reset My Password →</a>
    </div>
    <div class="box">
      <p style="font-size:13px;color:#FFD63A;margin:0;">⚠️ This link expires in <strong>1 hour</strong>.</p>
    </div>
    <p style="font-size:12px;color:#6B8B76;">If you didn't request a password reset, ignore this email. Your password remains unchanged.</p>
  `),

  paymentFailed: (user, booking) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">💳</div>
      <h2 class="error">Payment Failed</h2>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your payment for booking <strong>${booking.bookingId}</strong> could not be processed.</p>
    <div class="box">
      <div class="row"><span class="label">Amount</span><span class="value">₹${booking.amount.total}</span></div>
      <div class="row"><span class="label">Date Attempted</span><span class="value">${new Date().toLocaleDateString('en-IN')}</span></div>
    </div>
    <p>Please try again or contact your bank. Your slot will be held for <strong style="color:#FFD63A;">15 minutes</strong>.</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}/pay" class="btn">Retry Payment →</a>
    </div>
  `),

  otp: (user, otp) => baseTemplate(`
    <h2>Your OTP for TurfZone</h2>
    <p>Hi <span class="highlight">${user.name}</span>, use the OTP below to verify your phone number.</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#00E87A;font-family:monospace;">${otp}</div>
      <div style="color:#6B8B76;font-size:13px;margin-top:10px;">Valid for <strong style="color:#FFD63A;">${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong></div>
    </div>
    <p style="font-size:12px;color:#6B8B76;">Do not share this OTP with anyone. TurfZone will never ask for your OTP.</p>
  `),
};

// ── Main Send Function ─────────────────────────────────────
const sendEmail = async ({ to, subject, template, data = {} }) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const html = typeof template === 'function'
      ? template(...Object.values(data))
      : template;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"TurfZone" <${process.env.SMTP_USER}>`,
      to,
      subject: `TurfZone — ${subject}`,
      html,
    });

    logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`📧 Email failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Convenience Methods ────────────────────────────────────
module.exports = {
  sendEmail,
  templates,

  sendWelcome: (user) => sendEmail({
    to: user.email, subject: 'Welcome to TurfZone! 🎉',
    template: templates.welcome(user)
  }),

  sendEmailVerification: (user, verifyUrl) => sendEmail({
    to: user.email, subject: 'Verify Your Email',
    template: templates.emailVerification(user, verifyUrl)
  }),

  sendBookingConfirmation: (booking, user, turf) => sendEmail({
    to: user.email, subject: `Booking Confirmed — ${turf.name} | ${booking.bookingId}`,
    template: templates.bookingConfirmation(booking, user, turf)
  }),

  sendBookingCancellation: (booking, user, turf, refund) => sendEmail({
    to: user.email, subject: `Booking Cancelled — ${booking.bookingId}`,
    template: templates.bookingCancellation(booking, user, turf, refund)
  }),

  sendBookingReminder: (booking, user, turf, hours) => sendEmail({
    to: user.email, subject: `Reminder: Turf Session ${hours === 24 ? 'Tomorrow' : 'In 1 Hour'} ⏰`,
    template: templates.bookingReminder(booking, user, turf, hours)
  }),

  sendPasswordReset: (user, resetUrl) => sendEmail({
    to: user.email, subject: 'Reset Your Password',
    template: templates.passwordReset(user, resetUrl)
  }),

  sendPaymentFailed: (user, booking) => sendEmail({
    to: user.email, subject: 'Payment Failed — Action Required',
    template: templates.paymentFailed(user, booking)
  }),

  sendOTPEmail: (user, otp) => sendEmail({
    to: user.email, subject: `${otp} — Your TurfZone OTP`,
    template: templates.otp(user, otp)
  }),
};
