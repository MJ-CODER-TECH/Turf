import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

// ── Load Razorpay SDK dynamically ──────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ── Step indicator ─────────────────────────────────────────
const Step = ({ num, label, active, done }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300
      ${done  ? 'bg-green-500 border-green-500 text-white dark:text-[#0a1628]' :
        active ? 'bg-transparent border-green-500 text-green-500 animate-pulse' :
                 'bg-transparent dark:border-[#1a3a5c] border-gray-300 dark:text-slate-600 text-slate-400'}`}>
      {done ? '✓' : num}
    </div>
    <span className={`text-[10px] font-semibold tracking-wider uppercase
      ${active ? 'dark:text-green-400 text-green-600' : done ? 'dark:text-slate-300 text-slate-600' : 'dark:text-slate-600 text-slate-400'}`}>
      {label}
    </span>
  </div>
);

const StepDivider = ({ done }) => (
  <div className={`flex-1 h-0.5 mb-5 rounded-full transition-all duration-500
    ${done ? 'bg-green-500' : 'dark:bg-[#1a3a5c] bg-gray-200'}`} />
);

// ── Slot pill ──────────────────────────────────────────────
const SlotPill = ({ slot }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 dark:bg-[#0a1628] bg-gray-100 dark:border-[#1a3a5c] border-gray-200 border rounded-lg text-xs dark:text-slate-300 text-slate-600 font-medium">
    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
    {slot}
  </span>
);

// ── Main Page ──────────────────────────────────────────────
const BookingPage = () => {
  const { id }     = useParams();        // turfId from URL
  const location   = useLocation();
  const navigate   = useNavigate();
  const state      = location.state || {};

  // State passed from TurfDetailsPage
  const {
    turf,
    selectedDate,
    selectedSlots = [],
    bookingId,
    razorpayOrderId,
    total,
  } = state;

  const [step, setStep]               = useState(1); // 1=review, 2=paying, 3=done
  const [paying, setPaying]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(null);
  const [sdkLoading, setSdkLoading]   = useState(true);
  const [sdkReady, setSdkReady]       = useState(false);

  // If user lands here directly without state, redirect
  useEffect(() => {
    if (!bookingId || !razorpayOrderId) {
      navigate('/', { replace: true });
    }
  }, [bookingId, razorpayOrderId, navigate]);

  // Load Razorpay SDK on mount
  useEffect(() => {
    loadRazorpay().then((loaded) => {
      setSdkReady(loaded);
      setSdkLoading(false);
    });
  }, []);

  const handlePay = useCallback(async () => {
    if (!sdkReady) {
      setError('Payment SDK failed to load. Please refresh and try again.');
      return;
    }

    setPaying(true);
    setError('');
    setStep(2);

    const isWeekend = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; };
    const pricePerHour = isWeekend(selectedDate)
      ? (turf?.pricing?.weekend || turf?.price || 0)
      : (turf?.pricing?.weekday  || turf?.price || 0);

    const options = {
      key:         import.meta?.env?.VITE_RAZORPAY_KEY_ID,
      amount:      total * 100,
      currency:    'INR',
      name:        turf?.name || 'TurfZone',
      description: `${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''} on ${selectedDate}`,
      order_id:    razorpayOrderId,

      handler: async (response) => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_BASE_URL}/bookings/confirm`,
            {
              bookingId,
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSuccess({
            bookingId,
            total,
            slotCount: selectedSlots.length,
          });
          setStep(3);
        } catch (err) {
          setError('Payment received but confirmation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          setStep(1);
        } finally {
          setPaying(false);
        }
      },

      prefill: {
        name:    '',
        email:   '',
        contact: '',
      },

      theme: { color: '#22c55e' },

      modal: {
        ondismiss: () => {
          setPaying(false);
          setStep(1);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      setError(`Payment failed: ${resp.error.description}`);
      setPaying(false);
      setStep(1);
    });
    rzp.open();
  }, [sdkReady, bookingId, razorpayOrderId, total, selectedDate, selectedSlots, turf]);

  // ── Guards ───────────────────────────────────────────────
  if (!bookingId || !razorpayOrderId) return null;

  // ── Success Screen ───────────────────────────────────────
  if (step === 3 && success) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white border border-green-500/40 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-green-500/10 border-2 border-green-500/30 animate-ping" />
          <div className="relative w-24 h-24 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <p className="dark:text-green-400 text-green-600 text-xs font-black tracking-[4px] uppercase mb-2">
          Booking Confirmed 🎉
        </p>
        <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mb-1">{turf?.name}</h2>
        <p className="dark:text-slate-400 text-slate-500 text-sm mb-1">{selectedDate}</p>
        <p className="dark:text-slate-400 text-slate-500 text-sm mb-4">
          {success.slotCount} slot{success.slotCount > 1 ? 's' : ''} booked
        </p>
        <p className="dark:text-green-400 text-green-600 text-2xl font-extrabold mb-2">
          ₹{success.total} Paid
        </p>
        <p className="dark:text-slate-500 text-slate-400 text-xs mb-8">
          Confirmation sent to your email & SMS
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/my-bookings')}
            className="px-5 py-2.5 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors text-sm"
          >
            My Bookings
          </button>
          <button
            onClick={() => navigate(`/turf/${id}`)}
            className="px-5 py-2.5 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-xl dark:hover:border-green-500 hover:border-green-500 dark:hover:text-white hover:text-gray-900 transition-all text-sm"
          >
            Book More
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────
  const slotLabels = selectedSlots.map(s => {
    if (typeof s === 'string') return s;
    const h = parseInt(s.start);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:00 ${ampm}`;
  });

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pt-24 px-4 pb-16">
      <div className="max-w-lg mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 dark:text-slate-400 text-slate-500 text-sm mb-8 dark:hover:text-white hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to turf
        </button>

        {/* Header */}
        <div className="mb-8">
          <span className="dark:text-green-400 text-green-600 text-xs font-black tracking-[3px] uppercase">
            💳 Complete Payment
          </span>
          <h1 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-2 mb-2">
            Confirm Booking
          </h1>
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          <Step num={1} label="Review"  active={step === 1} done={step > 1} />
          <StepDivider done={step > 1} />
          <Step num={2} label="Payment" active={step === 2} done={step > 2} />
          <StepDivider done={step > 2} />
          <Step num={3} label="Done"    active={step === 3} done={step > 3} />
        </div>

        {/* Booking Card */}
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl overflow-hidden shadow-sm mb-4">

          {/* Turf header strip */}
          <div className="px-6 py-4 dark:bg-[#0a1628] bg-gray-50 dark:border-b dark:border-[#1a3a5c] border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="dark:text-white text-gray-900 font-extrabold text-base">{turf?.name}</p>
              <p className="dark:text-slate-500 text-slate-400 text-xs mt-0.5">
                {turf?.location?.area}, {turf?.location?.city}
              </p>
            </div>
            <span className="px-3 py-1 dark:bg-green-500/10 bg-green-50 dark:border-green-500/30 border-green-200 border rounded-lg text-xs dark:text-green-400 text-green-600 font-bold capitalize">
              {turf?.sport}
            </span>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">

            {/* Date */}
            <div className="flex items-center justify-between">
              <span className="dark:text-slate-400 text-slate-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 dark:text-green-400 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </span>
              <span className="dark:text-white text-gray-900 font-bold text-sm">{selectedDate}</span>
            </div>

            {/* Slots */}
            <div className="flex items-start justify-between gap-4">
              <span className="dark:text-slate-400 text-slate-500 text-sm flex items-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4 dark:text-green-400 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Slots
              </span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {slotLabels.map((s, i) => <SlotPill key={i} slot={s} />)}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between">
              <span className="dark:text-slate-400 text-slate-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 dark:text-green-400 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Duration
              </span>
              <span className="dark:text-white text-gray-900 font-bold text-sm">
                {selectedSlots.length} hr{selectedSlots.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="border-t dark:border-[#1a3a5c] border-gray-100" />

            {/* Amount breakdown */}
            {(() => {
              const isWeekend = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; };
              const pricePerHour = isWeekend(selectedDate)
                ? (turf?.pricing?.weekend || turf?.price || 0)
                : (turf?.pricing?.weekday  || turf?.price || 0);
              const base  = pricePerHour * selectedSlots.length;
              const taxes = Math.round(base * 0.18);

              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-slate-400 text-slate-500">
                      Base (₹{pricePerHour} × {selectedSlots.length})
                    </span>
                    <span className="dark:text-white text-gray-900">₹{base}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-slate-400 text-slate-500">GST (18%)</span>
                    <span className="dark:text-white text-gray-900">₹{taxes}</span>
                  </div>
                  <div className="border-t dark:border-[#1a3a5c] border-gray-100 pt-2 flex justify-between">
                    <span className="dark:text-white text-gray-900 font-extrabold text-base">Total</span>
                    <span className="dark:text-green-400 text-green-600 font-extrabold text-base">₹{total}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* SDK loading warning */}
        {!sdkLoading && !sdkReady && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 dark:text-yellow-400 text-sm">
            ⚠️ Payment SDK could not load. Check your internet connection and refresh.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 dark:text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={paying || sdkLoading || !sdkReady}
          className="w-full py-4 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-2xl hover:bg-green-400 active:scale-[0.98] transition-all duration-200 text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(34,197,94,0.25)]"
        >
          {sdkLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading payment...
            </span>
          ) : paying ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ₹${total} Securely →`
          )}
        </button>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-4 dark:text-slate-600 text-slate-400 text-xs">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            256-bit SSL
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secured by Razorpay
          </span>
          <span>•</span>
          <span>UPI / Card / Netbanking</span>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;