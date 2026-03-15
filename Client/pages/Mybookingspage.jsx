import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

// ── Helpers ────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  const [h] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${ampm}`;
};

const isUpcoming = (booking) => {
  if (booking.status !== 'confirmed') return false;
  const d = new Date(booking.date);
  const [h] = (booking.timeSlot?.start || '0:0').split(':');
  d.setHours(parseInt(h), 0, 0, 0);
  return d > new Date();
};

const canCancelBooking = (booking) => {
  if (!['confirmed', 'pending'].includes(booking.status)) return false;
  const d = new Date(booking.date);
  const [h] = (booking.timeSlot?.start || '0:0').split(':');
  d.setHours(parseInt(h), 0, 0, 0);
  const hoursUntil = (d - new Date()) / (1000 * 60 * 60);
  return hoursUntil > 0;
};

// ── Status config ──────────────────────────────────────────
const STATUS = {
  confirmed: {
    label: 'Confirmed',
    cls: 'dark:bg-green-500/10 bg-green-50 dark:border-green-500/30 border-green-200 dark:text-green-400 text-green-600',
    dot: 'bg-green-500',
    icon: '✓',
  },
  pending: {
    label: 'Pending',
    cls: 'dark:bg-yellow-500/10 bg-yellow-50 dark:border-yellow-500/30 border-yellow-200 dark:text-yellow-400 text-yellow-600',
    dot: 'bg-yellow-500',
    icon: '⏳',
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'dark:bg-red-500/10 bg-red-50 dark:border-red-500/30 border-red-200 dark:text-red-400 text-red-500',
    dot: 'bg-red-500',
    icon: '✕',
  },
  completed: {
    label: 'Completed',
    cls: 'dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/30 border-blue-200 dark:text-blue-400 text-blue-600',
    dot: 'bg-blue-400',
    icon: '⚑',
  },
  'no-show': {
    label: 'No Show',
    cls: 'dark:bg-slate-500/10 bg-slate-100 dark:border-slate-500/30 border-slate-300 dark:text-slate-400 text-slate-500',
    dot: 'bg-slate-400',
    icon: '—',
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Filter tabs ────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pending',   label: 'Pending' },
];

// ── Cancel Modal ───────────────────────────────────────────
const CancelModal = ({ booking, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');

  const d = new Date(booking.date);
  const [h] = (booking.timeSlot?.start || '0:0').split(':');
  d.setHours(parseInt(h), 0, 0, 0);
  const hoursUntil = (d - new Date()) / (1000 * 60 * 60);
  const willRefund = hoursUntil >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 dark:bg-black/70 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative dark:bg-[#0d1f3c] bg-white border dark:border-[#1a3a5c] border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl z-10">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h3 className="dark:text-white text-gray-900 font-extrabold text-lg text-center mb-1">
          Cancel Booking?
        </h3>
        <p className="dark:text-slate-400 text-slate-500 text-sm text-center mb-4">
          {booking.turfSnapshot?.name || booking.turf?.name} · {formatDate(booking.date)} · {formatTime(booking.timeSlot?.start)}
        </p>

        {/* Refund info */}
        <div className={`p-3 rounded-xl border mb-4 text-sm ${
          willRefund
            ? 'dark:bg-green-500/5 bg-green-50 dark:border-green-500/20 border-green-200 dark:text-green-400 text-green-600'
            : 'dark:bg-red-500/5 bg-red-50 dark:border-red-500/20 border-red-200 dark:text-red-400 text-red-500'
        }`}>
          {willRefund
            ? `✓ Eligible for full refund of ₹${booking.amount?.total}. Will be processed in 5–7 business days.`
            : '✕ No refund applicable — booking is within the 4-hour cancellation window.'}
        </div>

        {/* Reason */}
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          rows={2}
          className="w-full dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl px-3 py-2.5 text-sm dark:text-white text-gray-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:border-green-500 resize-none mb-4 transition-colors"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-xl text-sm font-bold hover:border-green-500 dark:hover:text-white transition-all"
          >
            Keep Booking
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 text-white font-extrabold rounded-xl text-sm hover:bg-red-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Cancelling...
              </span>
            ) : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Booking Card ───────────────────────────────────────────
const BookingCard = ({ booking, onCancel, style }) => {
  const navigate  = useNavigate();
  const upcoming  = isUpcoming(booking);
  const canCancel = canCancelBooking(booking);
  const turfName  = booking.turfSnapshot?.name || booking.turf?.name || 'Turf';
  const turfCity  = booking.turfSnapshot?.city || booking.turf?.location?.city || '';
  const turfArea  = booking.turfSnapshot?.location || booking.turf?.location?.area || '';
  const sport     = booking.turfSnapshot?.sport || booking.turf?.sport || '';
  const img       = booking.turf?.images?.[0]?.url;

  return (
    <div
      style={style}
      className={`dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:dark:border-[#2a4a7c] hover:border-gray-300
        ${upcoming ? 'ring-1 ring-green-500/20' : ''}`}
    >
      {/* Upcoming ribbon */}
      {upcoming && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs dark:text-green-400 text-green-600 font-bold tracking-wider uppercase">
            Upcoming Match
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Turf image / sport icon */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 dark:bg-[#0a1628] bg-gray-100 dark:border-[#1a3a5c] border-gray-200 border flex items-center justify-center">
            {img
              ? <img src={img} alt={turfName} className="w-full h-full object-cover" loading="lazy" />
              : <span className="text-2xl">
                  {sport === 'Football' ? '⚽' : sport === 'Cricket' ? '🏏' : sport === 'Badminton' ? '🏸' : '🏟️'}
                </span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="dark:text-white text-gray-900 font-extrabold text-base truncate">{turfName}</h3>
              <StatusBadge status={booking.status} />
            </div>
            <p className="dark:text-slate-500 text-slate-400 text-xs mb-2 truncate">
              {turfArea}{turfArea && turfCity ? ', ' : ''}{turfCity}
            </p>

            {/* Date & slot */}
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-500">
                <svg className="w-3.5 h-3.5 dark:text-green-400 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(booking.date)}
              </span>
              <span className="flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-500">
                <svg className="w-3.5 h-3.5 dark:text-green-400 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(booking.timeSlot?.start)} → {formatTime(booking.timeSlot?.end)}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t dark:border-[#1a3a5c] border-gray-100 my-4" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Amount */}
            <div>
              <p className="text-[10px] dark:text-slate-600 text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Paid</p>
              <p className="dark:text-green-400 text-green-600 font-extrabold text-sm">₹{booking.amount?.total}</p>
            </div>

            {/* Booking ref */}
            <div>
              <p className="text-[10px] dark:text-slate-600 text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Ref</p>
              <p className="dark:text-slate-300 text-slate-600 font-mono text-xs">{booking.bookingId || '—'}</p>
            </div>

            {/* Refund badge */}
            {booking.status === 'cancelled' && booking.refundAmount > 0 && (
              <div>
                <p className="text-[10px] dark:text-slate-600 text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Refund</p>
                <p className="dark:text-blue-400 text-blue-500 font-bold text-xs">₹{booking.refundAmount}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/bookings/${booking._id}`)}
              className="px-3 py-1.5 text-xs dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 rounded-lg dark:hover:border-green-500/50 hover:border-green-500/50 dark:hover:text-white hover:text-gray-900 transition-all font-semibold"
            >
              Details
            </button>
            {canCancel && (
              <button
                onClick={() => onCancel(booking)}
                className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 dark:text-red-400 text-red-500 rounded-lg hover:bg-red-500/20 hover:border-red-500/40 transition-all font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────
const EmptyState = ({ filter, onExplore }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl flex items-center justify-center mb-5 text-4xl shadow-sm">
      {filter === 'cancelled' ? '🚫' : filter === 'completed' ? '🏆' : '📋'}
    </div>
    <h3 className="dark:text-white text-gray-900 font-extrabold text-xl mb-2">
      {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
    </h3>
    <p className="dark:text-slate-500 text-slate-400 text-sm mb-6 max-w-xs">
      {filter === 'all'
        ? 'Book your first turf slot and get on the field!'
        : `You don't have any ${filter} bookings right now.`}
    </p>
    {filter === 'all' && (
      <button
        onClick={onExplore}
        className="px-6 py-2.5 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors text-sm"
      >
        Explore Turfs →
      </button>
    )}
  </div>
);

// ── Skeleton loader ────────────────────────────────────────
const SkeletonCard = () => (
  <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 animate-pulse">
    <div className="flex gap-4 mb-4">
      <div className="w-16 h-16 dark:bg-[#1a3a5c] bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 dark:bg-[#1a3a5c] bg-gray-200 rounded w-2/3" />
        <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/3" />
        <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/2" />
      </div>
    </div>
    <div className="border-t dark:border-[#1a3a5c] border-gray-100 pt-4 flex justify-between">
      <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/4" />
      <div className="h-7 dark:bg-[#1a3a5c] bg-gray-200 rounded w-20" />
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────
const MyBookingsPage = () => {
  const navigate = useNavigate();

  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filter, setFilter]             = useState('all');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState('');
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBookings = useCallback(async (pg = 1, statusFilter = 'all') => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { state: { from: '/my-bookings' } }); return; }

      const params = { page: pg, limit: 8 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await axios.get(`${API_BASE_URL}/bookings/my`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      setBookings(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: '/my-bookings' } });
      } else {
        setError(err.response?.data?.message || 'Failed to load bookings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings(1, filter);
    setPage(1);
  }, [filter]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchBookings(newPage, filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelConfirm = useCallback(async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_BASE_URL}/bookings/${cancelTarget._id}/cancel`,
        { reason: reason || 'Cancelled by user' },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      showToast(data.message || 'Booking cancelled successfully.');
      setCancelTarget(null);
      fetchBookings(page, filter);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Could not cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget, page, filter, fetchBookings]);

  // Stats from current page
  const stats = useMemo(() => {
    const all = bookings;
    return {
      total:     all.length,
      upcoming:  all.filter(isUpcoming).length,
      spent:     all.reduce((s, b) => s + (b.paymentStatus === 'paid' ? (b.amount?.total || 0) : 0), 0),
    };
  }, [bookings]);

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 pt-24">

        {/* Header */}
        <div className="mb-8">
          <span className="dark:text-green-400 text-green-600 text-xs font-black tracking-[3px] uppercase">
            📋 Booking History
          </span>
          <h1 className="dark:text-white text-gray-900 text-4xl font-extrabold mt-2 mb-2">
            My Bookings
          </h1>
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
        </div>

        {/* Stats bar */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'This Page',  value: pagination?.total ?? stats.total, suffix: ' bookings' },
              { label: 'Upcoming',   value: stats.upcoming, suffix: ' slots' },
              { label: 'Total Spent', value: `₹${stats.spent.toLocaleString('en-IN')}`, suffix: '' },
            ].map(item => (
              <div key={item.label}
                className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4 text-center shadow-sm">
                <p className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-wider font-bold mb-1">{item.label}</p>
                <p className="dark:text-white text-gray-900 font-extrabold text-lg leading-none">
                  {item.value}<span className="text-xs dark:text-slate-400 text-slate-500 font-normal">{item.suffix}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200
                ${filter === f.key
                  ? 'bg-green-500 dark:text-[#0a1628] text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                  : 'dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 dark:hover:border-green-500/40 hover:border-green-500/40 dark:hover:text-white hover:text-gray-900'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <p className="dark:text-red-400 text-red-500 text-sm">⚠️ {error}</p>
            <button
              onClick={() => fetchBookings(page, filter)}
              className="text-xs dark:text-slate-400 text-slate-500 underline hover:dark:text-white hover:text-gray-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState filter={filter} onExplore={() => navigate('/turfs')} />
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={setCancelTarget}
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl text-sm dark:text-slate-400 text-slate-500 disabled:opacity-30 dark:hover:border-green-500/50 hover:border-green-500/50 dark:hover:text-white hover:text-gray-900 transition-all disabled:cursor-not-allowed font-bold"
                >
                  ← Prev
                </button>

                <div className="flex gap-1">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const p = i + 1;
                    if (pagination.pages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.pages) {
                      if (p === 2 || p === pagination.pages - 1) return <span key={p} className="px-1 dark:text-slate-600 text-slate-400">…</span>;
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-extrabold transition-all duration-200
                          ${p === page
                            ? 'bg-green-500 dark:text-[#0a1628] text-white'
                            : 'dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 dark:hover:border-green-500/50 hover:border-green-500/50'
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl text-sm dark:text-slate-400 text-slate-500 disabled:opacity-30 dark:hover:border-green-500/50 hover:border-green-500/50 dark:hover:text-white hover:text-gray-900 transition-all disabled:cursor-not-allowed font-bold"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => { setCancelTarget(null); setCancelError(''); }}
          loading={cancelling}
        />
      )}

      {/* Cancel error (inside modal already, but also show below if modal closed) */}
      {cancelError && !cancelTarget && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg z-50">
          ⚠️ {cancelError}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 text-sm font-bold rounded-xl shadow-lg z-50 transition-all duration-300
          ${toast.type === 'success'
            ? 'bg-green-500 dark:text-[#0a1628] text-white'
            : 'bg-red-500 text-white'}`}
        >
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;