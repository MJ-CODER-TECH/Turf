const crypto = require('crypto');
const logger = require('../utils/logger');

let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
};

// ── Create Order ───────────────────────────────────────────
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  try {
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt: receipt || `TZ_${Date.now()}`,
      notes,
      payment_capture: 1
    });

    logger.info(`💳 Razorpay order created: ${order.id}`);
    return { success: true, order };

  } catch (err) {
    const errMsg = err?.error?.description || err?.message || JSON.stringify(err);
    logger.error(`💳 Razorpay order creation failed: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

// ── Verify Payment Signature ───────────────────────────────
const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const body = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === signature;

    logger.info(`💳 Payment verification for ${paymentId}: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;

  } catch (err) {
    logger.error(`💳 Payment verification error: ${err.message}`);
    return false;
  }
};

// ── Verify Webhook Signature ───────────────────────────────
const verifyWebhook = (body, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;

  } catch (err) {
    logger.error(`💳 Webhook verification error: ${err.message}`);
    return false;
  }
};

// ── Process Refund ─────────────────────────────────────────
const processRefund = async (paymentId, amount, notes = {}) => {
  try {
    const razorpay = getRazorpay();

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // convert to paise
      notes,
      speed: 'optimum'
    });

    logger.info(`💳 Refund processed: ${refund.id} for payment ${paymentId}`);
    return { success: true, refund };

  } catch (err) {
    // ✅ FIX: Proper Razorpay error handling
    const errMsg = err?.error?.description || err?.message || JSON.stringify(err);
    logger.error(`💳 Refund failed for ${paymentId}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

// ── Fetch Payment Details ──────────────────────────────────
const getPaymentDetails = async (paymentId) => {
  try {
    const razorpay = getRazorpay();

    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };

  } catch (err) {
    const errMsg = err?.error?.description || err?.message || JSON.stringify(err);
    logger.error(`💳 Fetch payment failed for ${paymentId}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

// ── Calculate Booking Amount ───────────────────────────────
const calculateAmount = (turf, date) => {
  const day = new Date(date).getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;

  const pricing = turf.pricing;
  const base = isWeekend ? pricing.weekend : pricing.weekday;

  const taxes = Math.round(base * 0.18); // 18% GST
  const total = base + taxes;

  return {
    base,
    taxes,
    discount: 0,
    total
  };
};

// ── Fetch Refund Status from Razorpay ─────────────────────
const getRazorpayRefundStatus = async (refundId) => {
  try {
    const razorpay = getRazorpay();
    const refund = await razorpay.refunds.fetch(refundId);
    // Razorpay status: 'pending' | 'processed' | 'failed'
    return { success: true, status: refund.status, refund };
  } catch (err) {
    const errMsg = err?.error?.description || err?.message || JSON.stringify(err);
    logger.error(`💳 Fetch refund failed for ${refundId}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

// module.exports mein add karo:
module.exports = {
  createOrder,
  verifyPayment,
  verifyWebhook,
  processRefund,
  getPaymentDetails,
  getRazorpayRefundStatus, // ← add this
  calculateAmount,
};