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
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

// ── Base Template ──────────────────────────────────────────
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
    .btn { display:inline-block; background:#00E87A; color:#000 !important; padding:14px 32px; font-weight:700; font-size:15px; text-decoration:none; margin:20px 0; letter-spacing:0.5px; border-radius:2px; }
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
    .error-text { color:#FF4D4D; }
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
      <p style="margin-top:6px;font-size:11px;">You received this because an account was created using this email on TurfZone.</p>
    </div>
  </div>
</body>
</html>`;

// ── Templates ──────────────────────────────────────────────
const templates = {

  // Sent AFTER email is verified — welcome to the platform
  welcome: (user) => baseTemplate(`
    <h2>You're In, <span class="highlight">${user.name}!</span> 🎉</h2>
    <p>Your TurfZone account is now active. Book premium sports turfs across Maharashtra — instantly and effortlessly.</p>
    <div class="box">
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:36px;margin-bottom:8px;">⚽ 🏏 🏸 🏀</div>
        <div style="font-size:18px;font-weight:700;color:#00E87A;">50+ Premium Turfs</div>
        <div style="color:#6B8B76;font-size:13px;margin-top:4px;">Football · Cricket · Badminton · Basketball · Tennis</div>
      </div>
    </div>
    <p>Get <strong style="color:#00E87A;">₹50 off</strong> your first booking — auto-applied at checkout!</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/turfs" class="btn">Browse Turfs →</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px;color:#6B8B76;">If you didn't create this account, contact us at support@turfzone.in.</p>
  `),

  // Sent during registration — contains the real verifyUrl with token
  emailVerification: (user, verifyUrl) => baseTemplate(`
    <h2>Verify Your Email Address</h2>
    <p>Hi <span class="highlight">${user.name}</span>, you're almost done! Click the button below to verify your email and activate your TurfZone account.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" class="btn">Verify My Email →</a>
    </div>
    <div class="box">
      <p style="font-size:13px;color:#6B8B76;margin:0;">
        ⏰ This link expires in <strong style="color:#FFD63A;">24 hours</strong>.
      </p>
      <p style="font-size:12px;color:#6B8B76;margin-top:10px;word-break:break-all;">
        Can't click the button? Copy this link:<br>
        <span style="color:#4FA8D5;">${verifyUrl}</span>
      </p>
    </div>
    <p style="font-size:12px;color:#6B8B76;">
      Didn't register on TurfZone? You can safely ignore this email — no account will be created.
    </p>
  `),

  // Booking confirmation
  bookingConfirmation: (booking, user, turf) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">🎉</div>
      <h2 style="color:#00E87A;font-size:26px;">Booking Confirmed!</h2>
      <span class="badge">Confirmed</span>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your turf booking is confirmed! Show this email (or the SMS) at the venue.</p>
    <div class="box">
      <div style="text-align:center;margin-bottom:16px;font-family:monospace;font-size:20px;font-weight:700;color:#00E87A;letter-spacing:3px;">${booking.bookingId}</div>
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Sport</span><span class="value">${turf.sport}</span></div>
      <div class="row"><span class="label">Location</span><span class="value">${turf.location.area}, ${turf.location.city}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
      <div class="row"><span class="label">Duration</span><span class="value">${booking.duration} minutes</span></div>
    </div>
    <div class="box">
      <div class="row"><span class="label">Amount Paid</span><span class="value highlight">₹${booking.amount.total}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">${booking.paymentMethod || 'Online'}</span></div>
    </div>
    <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);padding:14px;margin:16px 0;">
      <p style="color:#FFD63A;margin:0;font-size:13px;">⏰ Free cancellation up to <strong>4 hours before</strong> your slot. Cancel from your dashboard.</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}" class="btn">View Booking →</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px;color:#6B8B76;">Need help? support@turfzone.in or +91 99999 99999</p>
  `),

  bookingCancellation: (booking, user, turf, refundAmount) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">❌</div>
      <h2>Booking Cancelled</h2>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your booking has been cancelled.</p>
    <div class="box">
      <div class="row"><span class="label">Booking ID</span><span class="value">${booking.bookingId}</span></div>
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN')}</span></div>
      <div class="row"><span class="label">Time Slot</span><span class="value">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
    </div>
    ${refundAmount > 0 ? `
    <div class="box" style="border-color:rgba(0,232,122,0.3);">
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:24px;color:#00E87A;font-weight:700;">₹${refundAmount} Refund</div>
        <div style="color:#6B8B76;font-size:13px;margin-top:4px;">Will be processed in <strong style="color:#fff;">5-7 business days</strong></div>
      </div>
    </div>` : '<p class="warning">⚠️ No refund applicable (cancelled within 4-hour window).</p>'}
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL}/turfs" class="btn">Book Another Turf →</a>
    </div>
  `),

  bookingReminder: (booking, user, turf, hoursUntil) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">⏰</div>
      <h2>Match Reminder!</h2>
      <p style="color:#00E87A;font-size:16px;font-weight:600;">Your session is ${hoursUntil === 24 ? 'tomorrow' : 'in 1 hour'}!</p>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, get ready — your turf session is coming up!</p>
    <div class="box">
      <div class="row"><span class="label">Turf</span><span class="value">${turf.name}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
      <div class="row"><span class="label">Time</span><span class="value highlight">${booking.timeSlot.start} – ${booking.timeSlot.end}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${turf.location.address}, ${turf.location.city}</span></div>
      <div class="row"><span class="label">Booking ID</span><span class="value" style="font-family:monospace;">${booking.bookingId}</span></div>
    </div>
    ${turf.location.googleMapsUrl ? `
    <div style="background:rgba(0,232,122,0.05);border:1px solid rgba(0,232,122,0.15);padding:14px;margin:16px 0;">
      <p style="margin:0;font-size:13px;">📍 <a href="${turf.location.googleMapsUrl}" style="color:#00E87A;">Get Directions →</a></p>
    </div>` : ''}
    <p style="font-size:12px;color:#6B8B76;">Can't make it? Cancel at least 4 hours before for a full refund.</p>
  `),

  passwordReset: (user, resetUrl) => baseTemplate(`
    <h2>Reset Your Password</h2>
    <p>Hi <span class="highlight">${user.name}</span>, we received a password reset request for your TurfZone account.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn">Reset Password →</a>
    </div>
    <div class="box">
      <p style="font-size:13px;color:#FFD63A;margin:0;">⚠️ This link expires in <strong>1 hour</strong>. After that you'll need to request a new one.</p>
      <p style="font-size:12px;color:#6B8B76;margin-top:10px;word-break:break-all;">
        Can't click the button? Copy this link:<br>
        <span style="color:#4FA8D5;">${resetUrl}</span>
      </p>
    </div>
    <p style="font-size:12px;color:#6B8B76;">If you didn't request this, your account is safe — just ignore this email.</p>
  `),

  paymentFailed: (user, booking) => baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:3rem;">💳</div>
      <h2 class="error-text">Payment Failed</h2>
    </div>
    <p>Hi <span class="highlight">${user.name}</span>, your payment for booking <strong>${booking.bookingId}</strong> could not be processed.</p>
    <div class="box">
      <div class="row"><span class="label">Amount</span><span class="value">₹${booking.amount.total}</span></div>
      <div class="row"><span class="label">Date Attempted</span><span class="value">${new Date().toLocaleDateString('en-IN')}</span></div>
    </div>
    <p>Please try again or use a different payment method. Your slot is held for <strong style="color:#FFD63A;">15 minutes</strong>.</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}/pay" class="btn">Retry Payment →</a>
    </div>
  `),
};

// ── Core Send Function ─────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    // Verify connection before sending (skip in production for performance)
    if (process.env.NODE_ENV !== 'production') {
      await transporter.verify();
    }

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
    to:      user.email,
    subject: 'Welcome to TurfZone! 🎉',
    html:    templates.welcome(user),
  }),

  // user = { name, email } — called during registration (PendingUser)
  sendEmailVerification: (user, verifyUrl) => sendEmail({
    to:      user.email,
    subject: 'Verify Your Email — TurfZone',
    html:    templates.emailVerification(user, verifyUrl),
  }),

  sendBookingConfirmation: (booking, user, turf) => sendEmail({
    to:      user.email,
    subject: `Booking Confirmed — ${turf.name} | ${booking.bookingId}`,
    html:    templates.bookingConfirmation(booking, user, turf),
  }),

  sendBookingCancellation: (booking, user, turf, refund) => sendEmail({
    to:      user.email,
    subject: `Booking Cancelled — ${booking.bookingId}`,
    html:    templates.bookingCancellation(booking, user, turf, refund),
  }),

  sendBookingReminder: (booking, user, turf, hours) => sendEmail({
    to:      user.email,
    subject: `Reminder: Turf Session ${hours === 24 ? 'Tomorrow' : 'In 1 Hour'} ⏰`,
    html:    templates.bookingReminder(booking, user, turf, hours),
  }),

  sendPasswordReset: (user, resetUrl) => sendEmail({
    to:      user.email,
    subject: 'Reset Your Password',
    html:    templates.passwordReset(user, resetUrl),
  }),

  sendPaymentFailed: (user, booking) => sendEmail({
    to:      user.email,
    subject: 'Payment Failed — Action Required',
    html:    templates.paymentFailed(user, booking),
  }),
};