import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

// ── Helpers ────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

const formatTime = (t) => {
  if (!t) return '—';
  const [h] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${ampm}`;
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ✅ FIX: timeSlots array se pehla slot lo (backward compat ke saath)
const getFirstSlot = (booking) => {
  if (booking?.timeSlots?.length > 0) return booking.timeSlots[0];
  return booking?.timeSlot || null;
};

const getLastSlot = (booking) => {
  if (booking?.timeSlots?.length > 0) return booking.timeSlots[booking.timeSlots.length - 1];
  return booking?.timeSlot || null;
};

const getHoursUntil = (booking) => {
  const firstSlot = getFirstSlot(booking);
  if (!booking?.date || !firstSlot?.start) return null;
  const d = new Date(booking.date);
  const [h] = firstSlot.start.split(':').map(Number);
  d.setHours(h, 0, 0, 0);
  return (d - new Date()) / (1000 * 60 * 60);
};

// ── Status config ──────────────────────────────────────────
const STATUS_CFG = {
  confirmed: { label: 'Confirmed', dot: 'bg-green-500',  text: 'dark:text-green-400 text-green-600',   bg: 'dark:bg-green-500/10 bg-green-50 dark:border-green-500/30 border-green-200' },
  pending:   { label: 'Pending',   dot: 'bg-yellow-400', text: 'dark:text-yellow-400 text-yellow-600', bg: 'dark:bg-yellow-500/10 bg-yellow-50 dark:border-yellow-500/30 border-yellow-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500',    text: 'dark:text-red-400 text-red-500',       bg: 'dark:bg-red-500/10 bg-red-50 dark:border-red-500/30 border-red-200' },
  completed: { label: 'Completed', dot: 'bg-blue-400',   text: 'dark:text-blue-400 text-blue-600',     bg: 'dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/30 border-blue-200' },
  'no-show': { label: 'No Show',   dot: 'bg-slate-400',  text: 'dark:text-slate-400 text-slate-500',   bg: 'dark:bg-slate-500/10 bg-slate-100 dark:border-slate-500/30 border-slate-300' },
};

const StatusBadge = ({ status, large }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-2 border rounded-xl font-bold
      ${large ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'}
      ${cfg.bg} ${cfg.text}`}>
      <span className={`rounded-full flex-shrink-0 ${cfg.dot} ${large ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      {cfg.label}
    </span>
  );
};

// ── Info Row ───────────────────────────────────────────────
const InfoRow = ({ icon, label, value, green, mono }) => (
  <div className="flex items-start justify-between py-3 border-b dark:border-[#1a3a5c] border-gray-100 last:border-0">
    <span className="flex items-center gap-2 dark:text-slate-400 text-slate-500 text-sm flex-shrink-0">
      <span className="dark:text-green-400 text-green-600 w-4 text-center">{icon}</span>
      {label}
    </span>
    <span className={`text-sm font-bold text-right max-w-[55%] break-all
      ${green ? 'dark:text-green-400 text-green-600' :
        mono  ? 'dark:text-slate-300 text-slate-600 font-mono text-xs' :
                'dark:text-white text-gray-900'}`}>
      {value || '—'}
    </span>
  </div>
);

// ── QR Display ─────────────────────────────────────────────
const QRDisplay = ({ qrCode }) => {
  if (!qrCode) return null;
  let decoded = null;
  try { decoded = JSON.parse(atob(qrCode)); } catch { return null; }

  return (
    <div className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4 text-center">
      <div className="w-28 h-28 mx-auto mb-3 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border-2 rounded-xl flex items-center justify-center">
        <div className="grid grid-cols-5 gap-0.5 p-2">
          {[...Array(25)].map((_, i) => (
            <div key={i} className={`w-3.5 h-3.5 rounded-sm ${
              [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,7,12,17].includes(i)
                ? 'dark:bg-green-400 bg-green-600'
                : 'dark:bg-[#1a3a5c] bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
      <p className="dark:text-white text-gray-900 font-extrabold text-sm mb-1">Entry QR Code</p>
      <p className="dark:text-slate-500 text-slate-400 text-xs">Show this at the gate</p>
      {decoded?.bookingId && (
        <p className="dark:text-slate-600 text-slate-400 font-mono text-[10px] mt-2">{decoded.bookingId}</p>
      )}
    </div>
  );
};

// ── Cancel Modal ───────────────────────────────────────────
const CancelModal = ({ booking, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  const hrs = getHoursUntil(booking);
  const willRefund = hrs !== null && hrs >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 dark:bg-black/70 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-6 max-w-sm w-full shadow-xl z-10">
        <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="dark:text-white text-gray-900 font-extrabold text-lg text-center mb-4">Cancel Booking?</h3>

        <div className={`p-3 rounded-xl border mb-4 text-sm ${
          willRefund
            ? 'dark:bg-green-500/5 bg-green-50 dark:border-green-500/20 border-green-200 dark:text-green-400 text-green-600'
            : 'dark:bg-red-500/5 bg-red-50 dark:border-red-500/20 border-red-200 dark:text-red-400 text-red-500'
        }`}>
          {willRefund
            ? `✓ Full refund of ₹${booking.amount?.total} will be processed in 5–7 business days.`
            : '✕ No refund — within 4-hour cancellation window.'}
        </div>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={2}
          className="w-full dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl px-3 py-2.5 text-sm dark:text-white text-gray-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:border-green-500 resize-none mb-4 transition-colors"
        />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-xl text-sm font-bold hover:border-green-500 transition-all">
            Keep It
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 text-white font-extrabold rounded-xl text-sm hover:bg-red-400 active:scale-95 transition-all disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Cancelling...
              </span>
            ) : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────
const Skeleton = () => (
  <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pt-24 px-4 pb-16">
    <div className="max-w-2xl mx-auto animate-pulse space-y-4">
      <div className="h-4 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/3" />
      <div className="h-8 dark:bg-[#1a3a5c] bg-gray-200 rounded w-2/3" />
      <div className="h-1 dark:bg-[#1a3a5c] bg-gray-200 rounded w-12" />
      <div className="h-48 dark:bg-[#0d1f3c] bg-gray-100 rounded-2xl" />
      <div className="h-64 dark:bg-[#0d1f3c] bg-gray-100 rounded-2xl" />
      <div className="h-48 dark:bg-[#0d1f3c] bg-gray-100 rounded-2xl" />
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────
const BookingDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBooking = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { state: { from: `/bookings/${id}` } }); return; }
      const { data } = await axios.get(`${API_BASE_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setBooking(data.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else if (err.response?.status === 403) setError('You are not authorized to view this booking.');
      else if (err.response?.status === 404) setError('Booking not found.');
      else setError(err.response?.data?.message || 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const handleCancel = useCallback(async (reason) => {
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_BASE_URL}/bookings/${id}/cancel`,
        { reason: reason || 'Cancelled by user' },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      setShowCancel(false);
      showToast(data.message || 'Booking cancelled.');
      fetchBooking();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not cancel. Try again.', 'error');
    } finally {
      setCancelling(false);
    }
  }, [id, fetchBooking]);

  if (loading) return <Skeleton />;

  if (error) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="dark:text-white text-gray-900 font-extrabold text-lg mb-2">Oops!</h3>
        <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={() => navigate('/my-bookings')}
          className="px-6 py-2.5 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors text-sm">
          My Bookings
        </button>
      </div>
    </div>
  );

  if (!booking) return null;

  // ✅ FIX: timeSlots array se data lo
  const firstSlot = getFirstSlot(booking);
  const lastSlot  = getLastSlot(booking);
  const slotCount = booking.timeSlots?.length || 1;
  const hrs       = getHoursUntil(booking);
  const canCancel = ['confirmed', 'pending'].includes(booking.status) && hrs !== null && hrs > 0;
  const upcoming  = booking.status === 'confirmed' && hrs !== null && hrs > 0;
  const turfName  = booking.turfSnapshot?.name     || booking.turf?.name             || 'Turf';
  const turfCity  = booking.turfSnapshot?.city     || booking.turf?.location?.city   || '';
  const turfArea  = booking.turfSnapshot?.location || booking.turf?.location?.area   || '';
  const sport     = booking.turfSnapshot?.sport    || booking.turf?.sport            || '';
  const turfImg   = booking.turf?.images?.[0]?.url;
  const turfId    = booking.turf?._id || booking.turf;

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 py-6 pt-24">

        <button onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 dark:text-slate-400 text-slate-500 text-sm mb-6 dark:hover:text-white hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          My Bookings
        </button>

        <div className="mb-6">
          <span className="dark:text-green-400 text-green-600 text-xs font-black tracking-[3px] uppercase">🎫 Booking Detail</span>
          <div className="flex items-start justify-between mt-2 gap-3 flex-wrap">
            <h1 className="dark:text-white text-gray-900 text-3xl font-extrabold leading-tight">{turfName}</h1>
            <StatusBadge status={booking.status} large />
          </div>
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mt-3" />
        </div>

        {upcoming && (
          <div className="mb-4 px-4 py-3 dark:bg-green-500/10 bg-green-50 dark:border-green-500/30 border-green-200 border rounded-xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="dark:text-green-400 text-green-600 text-sm font-bold">
              {hrs < 1
                ? `⚡ Starting in ${Math.round(hrs * 60)} minutes!`
                : hrs < 24
                  ? `🕐 Starting in ${Math.round(hrs)} hours`
                  : `📅 ${Math.ceil(hrs / 24)} day${Math.ceil(hrs / 24) > 1 ? 's' : ''} away`}
            </p>
          </div>
        )}

        {/* Turf card */}
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl overflow-hidden shadow-sm mb-4">
          {turfImg && (
            <img src={turfImg} alt={turfName} className="w-full h-44 object-cover"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="dark:text-white text-gray-900 font-extrabold">{turfName}</p>
              <p className="dark:text-slate-500 text-slate-400 text-xs mt-0.5">
                {turfArea}{turfArea && turfCity ? ', ' : ''}{turfCity}
              </p>
            </div>
            <span className="px-3 py-1.5 dark:bg-green-500/10 bg-green-50 dark:border-green-500/30 border-green-200 border rounded-lg text-xs dark:text-green-400 text-green-600 font-bold capitalize">
              {sport || 'Sport'}
            </span>
          </div>
        </div>

        {/* Booking info */}
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm mb-4">
          <p className="dark:text-white text-gray-900 font-extrabold text-sm mb-1">Booking Info</p>
          <div className="w-6 h-0.5 bg-green-500 rounded-full mb-3" />
          <InfoRow icon="📋" label="Booking ID" value={booking.bookingId} mono />
          <InfoRow icon="📅" label="Date"       value={formatDate(booking.date)} />
          {/* ✅ FIX: first slot start → last slot end dikhao */}
          <InfoRow icon="🕐" label="Time"
            value={`${formatTime(firstSlot?.start)} → ${formatTime(lastSlot?.end)}`} />
          {/* ✅ FIX: dynamic duration from slotCount */}
          <InfoRow icon="⏱"  label="Duration"  value={`${slotCount} hr${slotCount > 1 ? 's' : ''}`} />
          {/* ✅ FIX: multiple slots list dikhao agar > 1 */}
          {slotCount > 1 && (
            <InfoRow icon="🗂" label="All Slots"
              value={booking.timeSlots.map(s => formatTime(s.start)).join(', ')} />
          )}
          <InfoRow icon="👥" label="Players"    value={`${booking.players || 10}`} />
          <InfoRow icon="🗓" label="Booked On"  value={formatDateTime(booking.createdAt)} />
        </div>

        {/* Payment info */}
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm mb-4">
          <p className="dark:text-white text-gray-900 font-extrabold text-sm mb-1">Payment</p>
          <div className="w-6 h-0.5 bg-green-500 rounded-full mb-3" />
          <InfoRow icon="💳" label="Method"     value={booking.paymentMethod || '—'} />
          <InfoRow icon="🧾" label="Base"       value={`₹${booking.amount?.base || 0}`} />
          <InfoRow icon="📊" label="GST (18%)"  value={`₹${booking.amount?.taxes || 0}`} />
          {booking.amount?.discount > 0 && (
            <InfoRow icon="🏷" label="Discount" value={`-₹${booking.amount.discount}`} green />
          )}
          <InfoRow icon="💰" label="Total Paid" value={`₹${booking.amount?.total || 0}`} green />
          {booking.razorpayPaymentId && (
            <InfoRow icon="🔑" label="Payment ID" value={booking.razorpayPaymentId} mono />
          )}
          {booking.razorpayOrderId && (
            <InfoRow icon="📦" label="Order ID"   value={booking.razorpayOrderId} mono />
          )}
        </div>

        {/* Cancellation info */}
        {booking.status === 'cancelled' && (
          <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm mb-4">
            <p className="dark:text-red-400 text-red-500 font-extrabold text-sm mb-1">Cancellation</p>
            <div className="w-6 h-0.5 bg-red-500 rounded-full mb-3" />
            <InfoRow icon="📅" label="Cancelled On"   value={formatDateTime(booking.cancelledAt)} />
            <InfoRow icon="📝" label="Reason"         value={booking.cancellationReason || '—'} />
            <InfoRow icon="💸" label="Refund Amount"  value={booking.refundAmount > 0 ? `₹${booking.refundAmount}` : 'No refund'} green={booking.refundAmount > 0} />
            {booking.refundStatus && (
              <InfoRow icon="🔄" label="Refund Status" value={booking.refundStatus} />
            )}
          </div>
        )}

        {/* QR Code — confirmed only */}
        {booking.status === 'confirmed' && booking.qrCode && (
          <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm mb-4">
            <p className="dark:text-white text-gray-900 font-extrabold text-sm mb-1">Entry Pass</p>
            <div className="w-6 h-0.5 bg-green-500 rounded-full mb-4" />
            <QRDisplay qrCode={booking.qrCode} />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate(`/turf/${turfId}`)}
            className="flex-1 py-3 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 font-bold rounded-xl text-sm dark:hover:border-green-500/50 hover:border-green-500/50 dark:hover:text-white hover:text-gray-900 transition-all">
            View Turf
          </button>
          {canCancel && (
            <button onClick={() => setShowCancel(true)}
              className="flex-1 py-3 bg-red-500/10 border border-red-500/20 dark:text-red-400 text-red-500 font-extrabold rounded-xl text-sm hover:bg-red-500/20 hover:border-red-500/40 transition-all">
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelModal
          booking={booking}
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 text-sm font-bold rounded-xl shadow-lg z-50 whitespace-nowrap
          ${toast.type === 'success' ? 'bg-green-500 dark:text-[#0a1628] text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}
    </div>
  );
};

export default BookingDetailPage;