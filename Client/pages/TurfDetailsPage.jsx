import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

const formatHour = (h) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${ampm}`;
};
const getTodayStr = () => new Date().toISOString().split('T')[0];
const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  return [0, 6].includes(new Date(dateStr).getDay());
};
const generateSlots = (openHour = 6, closeHour = 23) => {
  const slots = [];
  for (let h = openHour; h < closeHour; h++) {
    slots.push({
      start: `${String(h).padStart(2, '0')}:00`,
      end:   `${String(h + 1).padStart(2, '0')}:00`,
      label: formatHour(h),
      endLabel: formatHour(h + 1),
    });
  }
  return slots;
};

// ── Star Component ─────────────────────────────────────────
const Stars = ({ value, max = 5, size = 'sm', interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;
  const sz = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`${sz} transition-colors ${interactive ? 'cursor-pointer' : ''} ${
            i <= display ? 'text-yellow-400' : 'dark:text-slate-700 text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ── Rating Bar ─────────────────────────────────────────────
const RatingBar = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="dark:text-slate-400 text-slate-500 text-xs w-20 flex-shrink-0">{label}</span>
    <div className="flex-1 h-1.5 dark:bg-[#1a3a5c] bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 rounded-full transition-all duration-500"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
    <span className="dark:text-slate-300 text-slate-600 text-xs font-bold w-6 text-right">{value?.toFixed(1) || '—'}</span>
  </div>
);

// ── Review Card ────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const initials = (review.user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {review.user?.avatarUrl ? (
            <img src={review.user.avatarUrl} alt={review.user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-extrabold dark:text-green-400 text-green-600">{initials}</span>
            </div>
          )}
          <div>
            <p className="dark:text-white text-gray-900 font-bold text-sm">{review.user?.name || 'Anonymous'}</p>
            <p className="dark:text-slate-500 text-slate-400 text-xs">{date}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars value={review.rating?.overall} />
          {review.isVerified && (
            <span className="text-[10px] dark:text-green-400 text-green-600 font-semibold flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Title + Comment */}
      {review.title && (
        <p className="dark:text-white text-gray-900 font-bold text-sm mb-1">{review.title}</p>
      )}
      <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed">{review.comment}</p>

      {/* Sub ratings */}
      {(review.rating?.surface || review.rating?.facilities || review.rating?.cleanliness || review.rating?.value) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: 'surface',     label: 'Surface' },
            { key: 'facilities',  label: 'Facilities' },
            { key: 'cleanliness', label: 'Cleanliness' },
            { key: 'value',       label: 'Value' },
          ].filter(r => review.rating?.[r.key]).map(r => (
            <span key={r.key} className="flex items-center gap-1 px-2 py-1 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-lg text-xs">
              <span className="dark:text-slate-400 text-slate-500">{r.label}</span>
              <span className="dark:text-yellow-400 text-yellow-500 font-bold">{review.rating[r.key]}/5</span>
            </span>
          ))}
        </div>
      )}

      {/* Owner Reply */}
      {review.ownerReply?.text && (
        <div className="mt-3 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-3">
          <p className="dark:text-green-400 text-green-600 text-xs font-bold mb-1">🏟️ Owner Reply</p>
          <p className="dark:text-slate-400 text-slate-500 text-xs leading-relaxed">{review.ownerReply.text}</p>
          {review.ownerReply.repliedAt && (
            <p className="dark:text-slate-600 text-slate-400 text-[10px] mt-1">
              {new Date(review.ownerReply.repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Write Review Form ──────────────────────────────────────
const WriteReviewForm = ({ turfId, eligibleBookings, onSuccess }) => {
  const [form, setForm] = useState({
    bookingId:   eligibleBookings[0]?._id || '',
    rating: { overall: 0, surface: 0, facilities: 0, cleanliness: 0, value: 0 },
    title:   '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setRating = (key, val) => setForm(prev => ({ ...prev, rating: { ...prev.rating, [key]: val } }));

  const handleSubmit = async () => {
    if (!form.rating.overall) { setError('Please select an overall rating.'); return; }
    if (!form.comment.trim()) { setError('Please write a comment.'); return; }
    if (!form.bookingId)      { setError('No eligible booking found.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/reviews`, {
        turfId,
        bookingId: form.bookingId,
        rating:    form.rating,
        title:     form.title,
        comment:   form.comment,
      }, { headers: { Authorization: `Bearer ${token}` } });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl px-3 py-2.5 text-sm dark:text-white text-gray-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors resize-none";

  const SUB_RATINGS = [
    { key: 'surface',     label: 'Surface Quality' },
    { key: 'facilities',  label: 'Facilities' },
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'value',       label: 'Value for Money' },
  ];

  return (
    <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm">
      <p className="dark:text-white text-gray-900 font-extrabold text-sm mb-1">Write a Review</p>
      <div className="w-6 h-0.5 bg-green-500 rounded-full mb-4" />

      {/* Booking selector — agar multiple completed bookings hain */}
      {eligibleBookings.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
            Select Booking
          </label>
          <select
            value={form.bookingId}
            onChange={e => set('bookingId', e.target.value)}
            className={inputCls}
          >
            {eligibleBookings.map(b => {
              const slot = b.timeSlots?.[0] || b.timeSlot;
              const date = new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              return (
                <option key={b._id} value={b._id}>
                  {date} · {formatHour(parseInt(slot?.start))} · ₹{b.amount?.total}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Overall Rating */}
      <div className="mb-4">
        <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
          Overall Rating <span className="text-red-400">*</span>
        </label>
        <Stars value={form.rating.overall} size="lg" interactive onChange={val => setRating('overall', val)} />
      </div>

      {/* Sub ratings */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {SUB_RATINGS.map(r => (
          <div key={r.key}>
            <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-wider mb-1">
              {r.label}
            </label>
            <Stars value={form.rating[r.key]} size="md" interactive onChange={val => setRating(r.key, val)} />
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="mb-3">
        <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
          Title <span className="dark:text-slate-600 text-slate-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Summarize your experience..."
          maxLength={100}
          className={inputCls}
        />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
          Review <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.comment}
          onChange={e => set('comment', e.target.value)}
          placeholder="How was the turf? Surface condition, facilities, staff..."
          rows={4}
          maxLength={1000}
          className={inputCls}
        />
        <p className="dark:text-slate-600 text-slate-400 text-[10px] mt-1 text-right">
          {form.comment.length}/1000
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Submitting...
          </span>
        ) : 'Submit Review →'}
      </button>
    </div>
  );
};

// ── Reviews Section (full) ─────────────────────────────────
const ReviewsSection = ({ turf }) => {
  const [reviews, setReviews]           = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [pagination, setPagination]     = useState(null);
  const [page, setPage]                 = useState(1);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [submitted, setSubmitted]       = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(async (pg = 1) => {
    setLoadingReviews(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/reviews`, {
        params: { turfId: turf._id, page: pg, limit: 5 }
      });
      setReviews(pg === 1 ? data.data : prev => [...prev, ...data.data]);
      setPagination(data.pagination);
    } catch {
      // silent fail — reviews optional
    } finally {
      setLoadingReviews(false);
    }
  }, [turf._id]);

  // Check if logged-in user has completed bookings at this turf (to show form)
  const checkEligibility = useCallback(async () => {
    setCheckingEligibility(true);
    const token = localStorage.getItem('token');
    if (!token) { setCheckingEligibility(false); return; }
    try {
      const { data } = await axios.get(`${API_BASE_URL}/bookings/my`, {
        params: { status: 'completed', limit: 50 },
        headers: { Authorization: `Bearer ${token}` }
      });
      const eligible = (data.data || []).filter(b =>
        (b.turf?._id || b.turf) === turf._id && !b.hasReviewed
      );
      setEligibleBookings(eligible);
    } catch {
      // not logged in or error — no form shown
    } finally {
      setCheckingEligibility(false);
    }
  }, [turf._id]);

  useEffect(() => {
    fetchReviews(1);
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

  const handleReviewSuccess = () => {
    setSubmitted(true);
    setPage(1);
    fetchReviews(1);
    checkEligibility();
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  // Rating breakdown from turf object
  const avgRating = turf.rating?.average || 0;
  const ratingCount = turf.rating?.count || 0;

  // Compute breakdown from reviews
  const breakdown = useMemo(() => {
    if (!reviews.length) return null;
    const keys = ['surface', 'facilities', 'cleanliness', 'value'];
    const sums = { surface: 0, facilities: 0, cleanliness: 0, value: 0, n: {} };
    keys.forEach(k => { sums.n[k] = 0; });
    reviews.forEach(r => {
      keys.forEach(k => {
        if (r.rating?.[k]) { sums[k] += r.rating[k]; sums.n[k]++; }
      });
    });
    return keys.reduce((acc, k) => {
      acc[k] = sums.n[k] > 0 ? sums[k] / sums.n[k] : null;
      return acc;
    }, {});
  }, [reviews]);

  return (
    <section className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-2xl p-5 shadow-sm">
      <p className="dark:text-white text-gray-900 font-extrabold text-lg mb-1">Reviews</p>
      <div className="w-8 h-0.5 bg-green-500 rounded-full mb-5" />

      {/* ── Rating Summary ── */}
      {ratingCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl">
          {/* Big number */}
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <p className="dark:text-white text-gray-900 text-5xl font-extrabold leading-none">{avgRating.toFixed(1)}</p>
            <Stars value={avgRating} size="md" />
            <p className="dark:text-slate-500 text-slate-400 text-xs mt-1">{ratingCount} review{ratingCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Breakdown bars */}
          {breakdown && (
            <div className="flex-1 space-y-2">
              <RatingBar label="Surface"     value={breakdown.surface} />
              <RatingBar label="Facilities"  value={breakdown.facilities} />
              <RatingBar label="Cleanliness" value={breakdown.cleanliness} />
              <RatingBar label="Value"       value={breakdown.value} />
            </div>
          )}
        </div>
      )}

      {/* ── Write Review Form ── */}
      {!checkingEligibility && eligibleBookings.length > 0 && !submitted && (
        <div className="mb-6">
          <WriteReviewForm
            turfId={turf._id}
            eligibleBookings={eligibleBookings}
            onSuccess={handleReviewSuccess}
          />
        </div>
      )}

      {/* Success message */}
      {submitted && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 dark:text-green-400 text-sm font-bold">
          ✓ Your review has been submitted! Thank you.
        </div>
      )}

      {/* ── Reviews List ── */}
      {loadingReviews && reviews.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-9 h-9 dark:bg-[#1a3a5c] bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/3" />
                  <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-full" />
                <div className="h-3 dark:bg-[#1a3a5c] bg-gray-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">⭐</p>
          <p className="dark:text-white text-gray-900 font-bold mb-1">No reviews yet</p>
          <p className="dark:text-slate-500 text-slate-400 text-sm">Be the first to review this turf!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => <ReviewCard key={r._id} review={r} />)}

          {/* Load more */}
          {pagination && page < pagination.pages && (
            <button
              onClick={loadMore}
              disabled={loadingReviews}
              className="w-full py-2.5 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 rounded-xl text-sm font-bold dark:hover:border-green-500/50 hover:border-green-500/50 dark:hover:text-white hover:text-gray-900 transition-all disabled:opacity-50"
            >
              {loadingReviews ? 'Loading...' : `Load More (${pagination.total - reviews.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

// ── SlotGrid ───────────────────────────────────────────────
const SlotGrid = ({ slots, bookedSlots, pastSlots, selectedSlots, onToggle, loadingAvailability }) => {
  if (loadingAvailability) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-14 dark:bg-[#1a3a5c]/30 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => {
        const isBooked   = bookedSlots.includes(slot.start);
        const isPast     = pastSlots.includes(slot.start);
        const isSelected = selectedSlots.find(s => s.start === slot.start);
        const isDisabled = isBooked || isPast;

        let cls = 'relative flex flex-col items-center justify-center h-14 rounded-xl border-2 text-xs font-bold transition-all duration-200 select-none ';
        if (isPast)       cls += 'bg-slate-500/5 border-slate-500/20 text-slate-400/50 dark:text-slate-600 cursor-not-allowed';
        else if (isBooked) cls += 'bg-red-500/10 border-red-500/30 text-red-400/60 cursor-not-allowed line-through';
        else if (isSelected) cls += 'bg-green-500 border-green-400 text-white dark:text-[#0a1628] shadow-[0_0_14px_rgba(34,197,94,0.4)] scale-[1.03] cursor-pointer';
        else cls += 'dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 dark:text-slate-300 text-slate-600 dark:hover:border-green-500/60 hover:border-green-500/60 dark:hover:text-white hover:text-gray-900 dark:hover:bg-[#0d2a4a] hover:bg-green-50 cursor-pointer';

        return (
          <button key={slot.start} disabled={isDisabled} onClick={() => !isDisabled && onToggle(slot)} className={cls}>
            <span>{slot.label}</span>
            <span className="text-[10px] opacity-70 font-normal">→ {slot.endLabel}</span>
            {isPast && <span className="absolute top-1 right-1.5 text-[9px] text-slate-400/60 dark:text-slate-600 font-semibold">CLOSED</span>}
            {isBooked && !isPast && <span className="absolute top-1 right-1.5 text-[9px] text-red-400/70 font-semibold">FULL</span>}
            {isSelected && <span className="absolute top-1 right-1.5 text-[9px] text-white dark:text-[#0a1628] font-black">✓</span>}
          </button>
        );
      })}
    </div>
  );
};

// ── Booking Summary ────────────────────────────────────────
const BookingSummary = ({ selectedDate, selectedSlots, pricing, turf, onBook, booking }) => {
  const slotCount = selectedSlots.length;
  const pricePerHour = useMemo(() => {
    if (!pricing) return turf?.price || 0;
    return isWeekend(selectedDate) ? (pricing.weekend || turf?.price) : (pricing.weekday || turf?.price);
  }, [pricing, selectedDate, turf]);
  const base = pricePerHour * slotCount;
  const taxes = Math.round(base * 0.18);
  const total = base + taxes;
  if (!slotCount) return null;
  return (
    <div className="mt-4 dark:bg-[#0a1628] bg-gray-50 border border-green-500/30 rounded-xl p-4 space-y-2">
      <p className="dark:text-green-400 text-green-600 text-xs font-bold tracking-widest uppercase mb-3">📋 Booking Summary</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm"><span className="dark:text-slate-400 text-slate-500">Date</span><span className="dark:text-white text-gray-900 font-semibold">{selectedDate}</span></div>
        <div className="flex justify-between text-sm"><span className="dark:text-slate-400 text-slate-500">Slots ({slotCount})</span><span className="dark:text-white text-gray-900 font-semibold">{selectedSlots.map(s => s.label).join(', ')}</span></div>
        <div className="flex justify-between text-sm"><span className="dark:text-slate-400 text-slate-500">Duration</span><span className="dark:text-white text-gray-900 font-semibold">{slotCount} hr{slotCount > 1 ? 's' : ''}</span></div>
        <div className="border-t dark:border-[#1a3a5c] border-gray-200 my-2" />
        <div className="flex justify-between text-sm"><span className="dark:text-slate-400 text-slate-500">Base (₹{pricePerHour} × {slotCount})</span><span className="dark:text-white text-gray-900">₹{base}</span></div>
        <div className="flex justify-between text-sm"><span className="dark:text-slate-400 text-slate-500">GST (18%)</span><span className="dark:text-white text-gray-900">₹{taxes}</span></div>
        <div className="border-t dark:border-[#1a3a5c] border-gray-200 my-2" />
        <div className="flex justify-between text-base font-extrabold"><span className="dark:text-white text-gray-900">Total</span><span className="dark:text-green-400 text-green-600">₹{total}</span></div>
      </div>
      <button onClick={onBook} disabled={booking} className="w-full mt-3 py-3 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 active:scale-95 transition-all text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
        {booking ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</span> : `Pay ₹${total} →`}
      </button>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────
const TurfDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [selectedImage, setSelectedImage]   = useState(null);
  const [retryCount, setRetryCount]         = useState(0);
  const [selectedDate, setSelectedDate]     = useState(getTodayStr());
  const [selectedSlots, setSelectedSlots]   = useState([]);
  const [bookedSlots, setBookedSlots]       = useState([]);
  const [pastSlots, setPastSlots]           = useState([]);
  const [loadingAvail, setLoadingAvail]     = useState(false);
  const [booking, setBooking]               = useState(false);
  const [bookingError, setBookingError]     = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const ALL_SLOTS = useMemo(() => generateSlots(6, 23), []);
  const mainImage = useMemo(() => selectedImage || turf?.images?.[0]?.url || '/placeholder-turf.jpg', [selectedImage, turf]);

  const fetchTurf = useCallback(async () => {
    if (!id) { setError('Invalid turf ID'); setLoading(false); return; }
    try {
      setLoading(true); setError('');
      const { data } = await axios.get(`${API_BASE_URL}/turfs/${id}`, { timeout: 10000 });
      if (!data?.data) throw new Error('Invalid response');
      setTurf(data.data);
      setSelectedImage(data.data.images?.[0]?.url || null);
      setRetryCount(0);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Turf not found.' : err.response?.data?.message || 'Failed to load turf details.');
    } finally { setLoading(false); }
  }, [id]);

  const fetchAvailability = useCallback(async (date) => {
    if (!id || !date) return;
    setLoadingAvail(true);
    setSelectedSlots([]);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/bookings/availability`, { params: { turfId: id, date }, timeout: 8000 });
      const slots = data?.data?.slots || [];
      setPastSlots(slots.filter(s => s.isPast).map(s => s.start));
      setBookedSlots(slots.filter(s => !s.available && !s.isPast).map(s => s.start));
    } catch { setPastSlots([]); setBookedSlots([]); }
    finally { setLoadingAvail(false); }
  }, [id]);

  const toggleSlot = useCallback((slot) => {
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.start === slot.start);
      if (exists) return prev.filter(s => s.start !== slot.start);
      return [...prev, slot].sort((a, b) => a.start.localeCompare(b.start));
    });
    setBookingError('');
  }, []);

  const handleBook = useCallback(async () => {
    if (!selectedSlots.length) return;
    setBooking(true); setBookingError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { state: { from: `/turf/${id}` } }); return; }
      const pricePerHour = isWeekend(selectedDate) ? (turf?.pricing?.weekend || turf?.price) : (turf?.pricing?.weekday || turf?.price);
      const slotCount = selectedSlots.length;
      const total = pricePerHour * slotCount + Math.round(pricePerHour * slotCount * 0.18);
      const { data } = await axios.post(`${API_BASE_URL}/bookings/initiate`, {
        turfId: id, date: selectedDate,
        timeSlots: selectedSlots.map(s => ({ start: s.start, end: s.end })),
        players: turf?.capacity || 10
      }, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      if (!data?.data) throw new Error('Invalid booking response');
      const { razorpayOrderId, keyId, bookingMeta } = data.data;
      if (typeof window.Razorpay === 'undefined') {
        navigate(`/booking/${id}`, { state: { turf, selectedDate, selectedSlots, bookingMeta, razorpayOrderId, total } });
        return;
      }
      const rzp = new window.Razorpay({
        key: keyId || import.meta?.env?.VITE_RAZORPAY_KEY_ID,
        amount: total * 100, currency: 'INR',
        name: turf?.name || 'TurfZone',
        description: `${slotCount} slot${slotCount > 1 ? 's' : ''} on ${selectedDate}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const confirmToken = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/bookings/confirm`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingMeta,
            }, { headers: { Authorization: `Bearer ${confirmToken}` } });
            setBookingSuccess({ total, slotCount });
            setSelectedSlots([]);
            fetchAvailability(selectedDate);
          } catch { setBookingError('Payment received but confirmation failed. Contact support.'); }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#22c55e' },
        modal: { ondismiss: () => setBooking(false) },
      });
      rzp.on('payment.failed', (resp) => { setBookingError(`Payment failed: ${resp.error.description}`); setBooking(false); });
      rzp.open();
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Booking failed. Please try again.');
      setBooking(false);
    }
  }, [selectedSlots, selectedDate, turf, id, navigate, fetchAvailability]);

  useEffect(() => { fetchTurf(); }, [fetchTurf]);
  useEffect(() => { if (selectedDate) fetchAvailability(selectedDate); }, [selectedDate, fetchAvailability]);

  if (loading) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto animate-pulse space-y-4">
        <div className="h-5 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/3" />
        <div className="h-8 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/2" />
        <div className="h-[400px] dark:bg-[#0d1f3c] bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white border border-red-500/30 rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <h3 className="dark:text-white text-gray-900 text-xl font-extrabold mb-2">Something went wrong</h3>
        <p className="dark:text-slate-400 text-slate-500 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="px-5 py-2 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-lg hover:border-green-500 transition-all">Go Back</button>
          <button onClick={() => { setRetryCount(p => p + 1); fetchTurf(); }} disabled={retryCount >= 3} className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-40">
            {retryCount >= 3 ? 'Max retries' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!turf) return null;

  const { location, pricing, rating, amenities, rules, cancellationPolicy } = turf;

  if (bookingSuccess) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white border border-green-500/40 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="dark:text-green-400 text-green-600 text-xs font-bold tracking-widest uppercase mb-2">Booking Confirmed 🎉</p>
        <h3 className="dark:text-white text-gray-900 text-2xl font-extrabold mb-1">{turf.name}</h3>
        <p className="dark:text-slate-400 text-slate-500 mb-4">{bookingSuccess.slotCount} slot{bookingSuccess.slotCount > 1 ? 's' : ''} · ₹{bookingSuccess.total}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/my-bookings')} className="px-5 py-2.5 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors text-sm">My Bookings</button>
          <button onClick={() => setBookingSuccess(null)} className="px-5 py-2.5 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-xl hover:border-green-500 transition-all text-sm">Book More</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 pt-24">

        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm dark:text-slate-500 text-slate-400">
          <ol className="inline-flex items-center space-x-1">
            <li><button onClick={() => navigate('/')} className="dark:hover:text-green-400 hover:text-green-600 transition-colors">Home</button></li>
            <li><span className="mx-2 dark:text-[#1a3a5c] text-gray-300">/</span></li>
            <li><button onClick={() => navigate('/turfs')} className="dark:hover:text-green-400 hover:text-green-600 transition-colors">Turfs</button></li>
            <li><span className="mx-2 dark:text-[#1a3a5c] text-gray-300">/</span></li>
            <li className="dark:text-slate-300 text-gray-700 font-medium truncate max-w-xs">{turf.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">🏟️ Turf Details</span>
          <h1 className="dark:text-white text-gray-900 text-4xl font-extrabold mt-2 mb-3">{turf.name}</h1>
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-4" />
          <div className="flex flex-wrap items-center gap-4 dark:text-slate-400 text-slate-500 text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 dark:text-green-400 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              {location?.city}, {location?.area}
            </span>
            {rating?.average > 0 && (
              <span className="flex items-center gap-2 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border px-3 py-1 rounded-lg">
                <Stars value={rating.average} />
                <span className="dark:text-white text-gray-900 font-semibold">{rating.average.toFixed(1)}</span>
                <span className="dark:text-slate-500 text-slate-400">({rating.count} review{rating.count !== 1 ? 's' : ''})</span>
              </span>
            )}
          </div>
        </header>

        {/* Image Gallery */}
        {turf.images?.length > 0 ? (
          <div className="mb-8">
            <div className="mb-3 rounded-xl overflow-hidden dark:border-[#1a3a5c] border-gray-200 border">
              <img src={mainImage} alt={turf.name} className="w-full h-[420px] object-cover" onError={e => { e.target.src = '/placeholder-turf.jpg'; }} />
            </div>
            {turf.images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {turf.images.map((img, i) => (
                  <button key={img.public_id || i} onClick={() => setSelectedImage(img.url)}
                    className={`rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === img.url ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'dark:border-[#1a3a5c] border-gray-200 hover:border-green-500/50'}`}>
                    <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="w-full h-20 object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl h-[400px] flex items-center justify-center">
            <p className="dark:text-slate-500 text-slate-400">No images available</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <section className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 shadow-sm">
              <h2 className="dark:text-white text-gray-900 font-extrabold text-lg mb-1">About this Turf</h2>
              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-4" />
              <p className="dark:text-slate-400 text-slate-500 leading-relaxed">{turf.description}</p>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sport',      value: turf.sport },
                { label: 'Type',       value: turf.type },
                { label: 'Capacity',   value: `${turf.capacity} players` },
                { label: 'Base Price', value: `₹${turf.price}/hr`, green: true },
              ].map(item => (
                <div key={item.label} className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4 text-center hover:border-green-500/50 transition-colors shadow-sm">
                  <p className="dark:text-slate-500 text-slate-400 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`font-bold capitalize ${item.green ? 'dark:text-green-400 text-green-600' : 'dark:text-white text-gray-900'}`}>{item.value}</p>
                </div>
              ))}
            </section>

            {/* Book a Slot */}
            <section className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 shadow-sm">
              <h2 className="dark:text-white text-gray-900 font-extrabold text-lg mb-1">Book a Slot</h2>
              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-5" />
              <div className="mb-5">
                <label className="block dark:text-slate-400 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">📅 Select Date</label>
                <input type="date" value={selectedDate} min={getTodayStr()} onChange={e => setSelectedDate(e.target.value)}
                  className="w-full sm:w-56 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors cursor-pointer dark:[color-scheme:dark] [color-scheme:light]" />
                {selectedDate && (
                  <p className="dark:text-slate-500 text-slate-400 text-xs mt-1.5">
                    {isWeekend(selectedDate) ? '🏖️ Weekend rate applies' : '📅 Weekday rate applies'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs dark:text-slate-500 text-slate-400">
                {[['Available', 'dark:bg-[#0a1628] bg-gray-100 dark:border-[#1a3a5c] border-gray-300 border'], ['Selected', 'bg-green-500'], ['Full', 'bg-red-500/20 border border-red-500/30'], ['Closed', 'bg-slate-500/10 border border-slate-500/20']].map(([label, cls]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded inline-block ${cls}`} />{label}
                  </span>
                ))}
              </div>
              <SlotGrid slots={ALL_SLOTS} bookedSlots={bookedSlots} pastSlots={pastSlots} selectedSlots={selectedSlots} onToggle={toggleSlot} loadingAvailability={loadingAvail} />
              {selectedSlots.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="dark:text-green-400 text-green-600 text-sm font-bold">
                    {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                    <span className="dark:text-slate-500 text-slate-400 font-normal ml-2">({selectedSlots.map(s => s.label).join(', ')})</span>
                  </p>
                  <button onClick={() => setSelectedSlots([])} className="dark:text-slate-500 text-slate-400 text-xs hover:text-red-400 transition-colors">Clear all</button>
                </div>
              )}
              {bookingError && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 dark:text-red-400 text-sm">⚠️ {bookingError}</div>}
              <div className="lg:hidden">
                <BookingSummary selectedDate={selectedDate} selectedSlots={selectedSlots} pricing={pricing} turf={turf} onBook={handleBook} booking={booking} />
              </div>
            </section>

            {/* Amenities */}
            {amenities?.length > 0 && (
              <section className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 shadow-sm">
                <h2 className="dark:text-white text-gray-900 font-extrabold text-lg mb-1">Amenities</h2>
                <div className="w-8 h-0.5 bg-green-500 rounded-full mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="dark:text-slate-300 text-slate-600 text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rules */}
            {rules?.length > 0 && (
              <section className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 shadow-sm">
                <h2 className="dark:text-white text-gray-900 font-extrabold text-lg mb-1">House Rules</h2>
                <div className="w-8 h-0.5 bg-green-500 rounded-full mb-4" />
                <ul className="space-y-2">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 dark:text-slate-400 text-slate-500 text-sm">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ✅ REVIEWS SECTION */}
            <ReviewsSection turf={turf} />

          </div>

          {/* Right — Sticky Booking Card */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 sticky top-24 shadow-sm">
              <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">💰 Pricing</span>
              <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-1">Pricing Details</h2>
              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-5" />
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Weekday', value: `₹${pricing?.weekday}/hr` },
                  { label: 'Weekend', value: `₹${pricing?.weekend}/hr` },
                  ...(pricing?.holiday ? [{ label: 'Holiday', value: `₹${pricing.holiday}/hr` }] : []),
                  ...(pricing?.peak?.enabled ? [{ label: 'Peak Hours', value: `₹${pricing.peak.price}/hr`, green: true }] : []),
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 dark:border-[#1a3a5c] border-gray-200 border-b">
                    <span className="dark:text-slate-400 text-slate-500 text-sm">{item.label}</span>
                    <span className={`font-bold text-sm ${item.green ? 'dark:text-green-400 text-green-600' : 'dark:text-white text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              {cancellationPolicy && (
                <div className="mb-5 p-4 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl">
                  <h3 className="dark:text-white text-gray-900 font-bold text-sm mb-2">Cancellation Policy</h3>
                  <p className="dark:text-slate-400 text-slate-500 text-xs mb-1">Free cancellation up to {cancellationPolicy.freeUntilHours} hours before booking</p>
                  <p className="dark:text-slate-400 text-slate-500 text-xs">Refund: <span className="dark:text-green-400 text-green-600 font-semibold">{cancellationPolicy.refundPercent}%</span></p>
                </div>
              )}
              <BookingSummary selectedDate={selectedDate} selectedSlots={selectedSlots} pricing={pricing} turf={turf} onBook={handleBook} booking={booking} />
              {selectedSlots.length === 0 && (
                <button disabled className="w-full py-3 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-500 text-slate-400 font-extrabold rounded-xl text-sm tracking-wide cursor-not-allowed">
                  ← Select slots to book
                </button>
              )}
              {bookingError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 dark:text-red-400 text-xs">⚠️ {bookingError}</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TurfDetailsPage;