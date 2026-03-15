import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const formatHour = (h) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${ampm}`;
};

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
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

// ── SlotGrid Component ─────────────────────────────────────
const SlotGrid = ({ slots, bookedSlots, selectedSlots, onToggle, loadingAvailability }) => {
  if (loadingAvailability) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-14 bg-[#1a3a5c]/30 dark:bg-[#1a3a5c]/30 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isBooked   = bookedSlots.includes(slot.start);
        const isSelected = selectedSlots.find(s => s.start === slot.start);

        let cls = 'relative flex flex-col items-center justify-center h-14 rounded-xl border-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none ';

        if (isBooked) {
          cls += 'bg-red-500/10 border-red-500/30 text-red-400/60 cursor-not-allowed line-through';
        } else if (isSelected) {
          cls += 'bg-green-500 border-green-400 text-white dark:text-[#0a1628] shadow-[0_0_14px_rgba(34,197,94,0.4)] scale-[1.03]';
        } else {
          cls += 'dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 dark:text-slate-300 text-slate-600 dark:hover:border-green-500/60 hover:border-green-500/60 dark:hover:text-white hover:text-gray-900 dark:hover:bg-[#0d2a4a] hover:bg-green-50';
        }

        return (
          <button
            key={slot.start}
            disabled={isBooked}
            onClick={() => !isBooked && onToggle(slot)}
            className={cls}
          >
            <span>{slot.label}</span>
            <span className="text-[10px] opacity-70 font-normal">→ {slot.endLabel}</span>
            {isBooked && (
              <span className="absolute top-1 right-1.5 text-[9px] text-red-400/70 font-semibold">FULL</span>
            )}
            {isSelected && (
              <span className="absolute top-1 right-1.5 text-[9px] text-white dark:text-[#0a1628] font-black">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── Booking Summary Card ───────────────────────────────────
const BookingSummary = ({ selectedDate, selectedSlots, pricing, turf, onBook, booking }) => {
  const slotCount = selectedSlots.length;

  const pricePerHour = useMemo(() => {
    if (!pricing) return turf?.price || 0;
    return isWeekend(selectedDate) ? (pricing.weekend || turf?.price) : (pricing.weekday || turf?.price);
  }, [pricing, selectedDate, turf]);

  const base  = pricePerHour * slotCount;
  const taxes = Math.round(base * 0.18);
  const total = base + taxes;

  if (slotCount === 0) return null;

  return (
    <div className="mt-4 dark:bg-[#0a1628] bg-gray-50 border border-green-500/30 rounded-xl p-4 space-y-2">
      <p className="dark:text-green-400 text-green-600 text-xs font-bold tracking-widest uppercase mb-3">📋 Booking Summary</p>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="dark:text-slate-400 text-slate-500">Date</span>
          <span className="dark:text-white text-gray-900 font-semibold">{selectedDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="dark:text-slate-400 text-slate-500">Slots ({slotCount})</span>
          <span className="dark:text-white text-gray-900 font-semibold">
            {selectedSlots.map(s => s.label).join(', ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="dark:text-slate-400 text-slate-500">Duration</span>
          <span className="dark:text-white text-gray-900 font-semibold">{slotCount} hr{slotCount > 1 ? 's' : ''}</span>
        </div>
        <div className="border-t dark:border-[#1a3a5c] border-gray-200 my-2" />
        <div className="flex justify-between text-sm">
          <span className="dark:text-slate-400 text-slate-500">Base (₹{pricePerHour} × {slotCount})</span>
          <span className="dark:text-white text-gray-900">₹{base}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="dark:text-slate-400 text-slate-500">GST (18%)</span>
          <span className="dark:text-white text-gray-900">₹{taxes}</span>
        </div>
        <div className="border-t dark:border-[#1a3a5c] border-gray-200 my-2" />
        <div className="flex justify-between text-base font-extrabold">
          <span className="dark:text-white text-gray-900">Total</span>
          <span className="dark:text-green-400 text-green-600">₹{total}</span>
        </div>
      </div>

      <button
        onClick={onBook}
        disabled={booking}
        className="w-full mt-3 py-3 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 active:scale-95 transition-all duration-200 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {booking ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Processing...
          </span>
        ) : `Pay ₹${total} →`}
      </button>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────
const TurfDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [retryCount, setRetryCount]       = useState(0);

  const [selectedDate, setSelectedDate]   = useState(getTodayStr());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots]     = useState([]);
  const [loadingAvail, setLoadingAvail]   = useState(false);
  const [booking, setBooking]             = useState(false);
  const [bookingError, setBookingError]   = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const ALL_SLOTS = useMemo(() => generateSlots(6, 23), []);

  const mainImage = useMemo(() =>
    selectedImage || turf?.images?.[0]?.url || '/placeholder-turf.jpg',
    [selectedImage, turf]
  );

  const fetchTurf = useCallback(async () => {
    if (!id) { setError('Invalid turf ID'); setLoading(false); return; }
    try {
      setLoading(true); setError('');
      const { data } = await axios.get(`${API_BASE_URL}/turfs/${id}`, { timeout: 10000 });
      if (!data?.data) throw new Error('Invalid response structure');
      setTurf(data.data);
      setSelectedImage(data.data.images?.[0]?.url || null);
      setRetryCount(0);
    } catch (err) {
      setError(
        err.code === 'ECONNABORTED' ? 'Request timeout. Please check your connection.' :
        err.response?.status === 404 ? 'Turf not found.' :
        err.response?.data?.message || 'Failed to load turf details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAvailability = useCallback(async (date) => {
    if (!id || !date) return;
    setLoadingAvail(true);
    setSelectedSlots([]);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/bookings/availability`, {
        params: { turfId: id, date },
        timeout: 8000,
      });
      setBookedSlots(data?.data?.bookedSlots || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingAvail(false);
    }
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
    setBooking(true);
    setBookingError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/turf/${id}` } });
        return;
      }
      const pricePerHour = isWeekend(selectedDate)
        ? (turf?.pricing?.weekend || turf?.price)
        : (turf?.pricing?.weekday || turf?.price);
      const slotCount = selectedSlots.length;
      const base  = pricePerHour * slotCount;
      const taxes = Math.round(base * 0.18);
      const total = base + taxes;
      const { data } = await axios.post(
        `${API_BASE_URL}/bookings/initiate`,
        { turfId: id, date: selectedDate, timeSlots: selectedSlots.map(s => ({ start: s.start, end: s.end })), players: turf?.capacity || 10 },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );
      if (!data?.data) throw new Error('Invalid booking response');
      const { razorpayOrderId, bookingId, keyId } = data.data;
      const options = {
        key: keyId || import.meta?.env?.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
        name: turf?.name || 'TurfZone',
        description: `${slotCount} slot${slotCount > 1 ? 's' : ''} on ${selectedDate}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const confirmToken = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/bookings/confirm`, {
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }, { headers: { Authorization: `Bearer ${confirmToken}` } });
            setBookingSuccess({ bookingId, total, slotCount });
            setSelectedSlots([]);
            fetchAvailability(selectedDate);
          } catch {
            setBookingError('Payment received but confirmation failed. Contact support.');
          }
        },
        prefill: { name: '', email: '', contact: turf?.turfSnapshot?.ownerPhone || '' },
        theme: { color: '#22c55e' },
        modal: { ondismiss: () => setBooking(false) },
      };
      if (typeof window.Razorpay === 'undefined') {
        navigate(`/booking/${id}`, { state: { turf, selectedDate, selectedSlots, bookingId, razorpayOrderId, total } });
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }, [selectedSlots, selectedDate, turf, id, navigate, fetchAvailability]);

  const handleRetry  = useCallback(() => { setRetryCount(prev => prev + 1); fetchTurf(); }, [fetchTurf]);
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => { fetchTurf(); }, [fetchTurf]);
  useEffect(() => { if (selectedDate) fetchAvailability(selectedDate); }, [selectedDate, fetchAvailability]);

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-5 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-8 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 dark:bg-[#1a3a5c] bg-gray-200 rounded w-1/4 mb-8" />
        <div className="h-[400px] dark:bg-[#0d1f3c] bg-gray-100 rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 dark:bg-[#0d1f3c] bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 dark:bg-[#0d1f3c] bg-gray-100 rounded-xl" />)}
            </div>
          </div>
          <div className="h-64 dark:bg-[#0d1f3c] bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white border border-red-500/30 rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="dark:text-white text-gray-900 text-xl font-extrabold mb-2">Something went wrong</h3>
        <p className="dark:text-slate-400 text-slate-500 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={handleGoBack} className="px-5 py-2 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-lg hover:border-green-500 dark:hover:text-white hover:text-gray-900 transition-all duration-200">Go Back</button>
          <button onClick={handleRetry} disabled={retryCount >= 3} className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Not Found ────────────────────────────────────────────
  if (!turf) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <h3 className="dark:text-white text-gray-900 text-xl font-extrabold mb-2">Turf Not Found</h3>
        <p className="dark:text-slate-400 text-slate-500 mb-6">The turf you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleGoBack} className="px-6 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors">Go Back</button>
      </div>
    </div>
  );

  const { location, pricing, rating, amenities, rules, cancellationPolicy } = turf;

  // ── Booking Success ──────────────────────────────────────
  if (bookingSuccess) return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center px-4">
      <div className="dark:bg-[#0d1f3c] bg-white border border-green-500/40 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="dark:text-green-400 text-green-600 text-xs font-bold tracking-widest uppercase mb-2">Booking Confirmed 🎉</p>
        <h3 className="dark:text-white text-gray-900 text-2xl font-extrabold mb-1">{turf.name}</h3>
        <p className="dark:text-slate-400 text-slate-500 mb-1">{selectedDate}</p>
        <p className="dark:text-slate-400 text-slate-500 text-sm mb-4">{bookingSuccess.slotCount} slot{bookingSuccess.slotCount > 1 ? 's' : ''} booked</p>
        <p className="dark:text-green-400 text-green-600 text-xl font-extrabold mb-6">₹{bookingSuccess.total} Paid</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/my-bookings')} className="px-5 py-2.5 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors text-sm">
            My Bookings
          </button>
          <button onClick={() => setBookingSuccess(null)} className="px-5 py-2.5 dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-300 text-slate-600 rounded-xl hover:border-green-500 dark:hover:text-white hover:text-gray-900 transition-all text-sm">
            Book More
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────
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
              <svg className="w-4 h-4 dark:text-green-400 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {location?.city}, {location?.area}
            </span>
            {rating?.average > 0 && (
              <span className="flex items-center gap-1 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border px-3 py-1 rounded-lg">
                <span className="text-yellow-400">⭐</span>
                <span className="dark:text-white text-gray-900 font-semibold">{rating.average.toFixed(1)}</span>
                <span className="dark:text-slate-500 text-slate-400">({rating.count} {rating.count === 1 ? 'review' : 'reviews'})</span>
              </span>
            )}
          </div>
        </header>

        {/* Image Gallery */}
        {turf.images?.length > 0 ? (
          <div className="mb-8">
            <div className="mb-3 rounded-xl overflow-hidden dark:border-[#1a3a5c] border-gray-200 border">
              <img src={mainImage} alt={turf.name} className="w-full h-[420px] object-cover"
                onError={(e) => { e.target.src = '/placeholder-turf.jpg'; }} />
            </div>
            {turf.images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {turf.images.map((img, index) => (
                  <button key={img.public_id || index} onClick={() => setSelectedImage(img.url)}
                    className={`rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === img.url
                        ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                        : 'dark:border-[#1a3a5c] border-gray-200 hover:border-green-500/50'
                    }`}>
                    <img src={img.url} alt={img.alt || `Image ${index + 1}`} className="w-full h-20 object-cover" loading="lazy" />
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

          {/* Left — Details */}
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
              ].map((item) => (
                <div key={item.label} className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl p-4 text-center hover:border-green-500/50 transition-colors duration-200">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`font-bold capitalize ${item.green ? 'text-green-400' : 'text-white'}`}>{item.value}</p>
                </div>
              ))}
            </section>

            {/* ── TIME SLOT BOOKING SECTION ── */}
            <section className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl p-6">
              <h2 className="text-white font-extrabold text-lg mb-1">Book a Slot</h2>
              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-5" />

              {/* Date Picker */}
              <div className="mb-5">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  📅 Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayStr()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-56 bg-[#0a1628] border border-[#1a3a5c] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
                />
                {selectedDate && (
                  <p className="text-slate-500 text-xs mt-1.5">
                    {isWeekend(selectedDate) ? '🏖️ Weekend rate applies' : '📅 Weekday rate applies'}
                  </p>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#0a1628] border border-[#1a3a5c] inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block" />
                  Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30 inline-block" />
                  Booked
                </span>
              </div>

              {/* Slot Grid */}
              <SlotGrid
                slots={ALL_SLOTS}
                bookedSlots={bookedSlots}
                selectedSlots={selectedSlots}
                onToggle={toggleSlot}
                loadingAvailability={loadingAvail}
              />

              {/* Selected count */}
              {selectedSlots.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-green-400 text-sm font-bold">
                    {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                    <span className="text-slate-500 font-normal ml-2">
                      ({selectedSlots.map(s => s.label).join(', ')})
                    </span>
                  </p>
                  <button
                    onClick={() => setSelectedSlots([])}
                    className="text-slate-500 text-xs hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Booking Error */}
              {bookingError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  ⚠️ {bookingError}
                </div>
              )}

              {/* Booking Summary inline (mobile — shows below slot grid) */}
              <div className="lg:hidden">
                <BookingSummary
                  selectedDate={selectedDate}
                  selectedSlots={selectedSlots}
                  pricing={pricing}
                  turf={turf}
                  onBook={handleBook}
                  booking={booking}
                />
              </div>
            </section>

            {/* Amenities */}
            {amenities?.length > 0 && (
              <section className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl p-6">
                <h2 className="text-white font-extrabold text-lg mb-1">Amenities</h2>
                <div className="w-8 h-0.5 bg-green-500 rounded-full mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rules */}
            {rules?.length > 0 && (
              <section className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl p-6">
                <h2 className="text-white font-extrabold text-lg mb-1">House Rules</h2>
                <div className="w-8 h-0.5 bg-green-500 rounded-full mb-4" />
                <ul className="space-y-2">
                  {rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Map Placeholder */}
            <section className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl overflow-hidden">
              <div className="px-6 pt-6 pb-3">
                <h2 className="text-white font-extrabold text-lg mb-1">Location</h2>
                <div className="w-8 h-0.5 bg-green-500 rounded-full" />
              </div>
              <div className="relative h-56 bg-[#0a1628] flex items-center justify-center mx-4 mb-4 rounded-xl border border-[#1a3a5c]">
                <div className="text-center">
                  <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
                  </svg>
                  <p className="text-slate-400 text-sm">Google Maps Placeholder</p>
                  <p className="text-slate-600 text-xs mt-1">API integration ready</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right — Sticky Booking Card (desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-[#0d1f3c] border border-[#1a3a5c] rounded-xl p-6 sticky top-24">
              <span className="text-green-400 text-xs font-bold tracking-[3px] uppercase">💰 Pricing</span>
              <h2 className="text-white text-2xl font-extrabold mt-1 mb-1">Pricing Details</h2>
              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-5" />

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Weekday', value: `₹${pricing?.weekday}/hr` },
                  { label: 'Weekend', value: `₹${pricing?.weekend}/hr` },
                  ...(pricing?.holiday ? [{ label: 'Holiday', value: `₹${pricing.holiday}/hr` }] : []),
                  ...(pricing?.peak?.enabled ? [{ label: 'Peak Hours', value: `₹${pricing.peak.price}/hr`, green: true }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-[#1a3a5c]">
                    <span className="text-slate-400 text-sm">{item.label}</span>
                    <span className={`font-bold text-sm ${item.green ? 'text-green-400' : 'text-white'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {cancellationPolicy && (
                <div className="mb-5 p-4 bg-[#0a1628] border border-[#1a3a5c] rounded-xl">
                  <h3 className="text-white font-bold text-sm mb-2">Cancellation Policy</h3>
                  <p className="text-slate-400 text-xs mb-1">Free cancellation up to {cancellationPolicy.freeUntilHours} hours before booking</p>
                  <p className="text-slate-400 text-xs">Refund: <span className="text-green-400 font-semibold">{cancellationPolicy.refundPercent}%</span></p>
                </div>
              )}

              {/* Booking summary + pay button (desktop) */}
              <BookingSummary
                selectedDate={selectedDate}
                selectedSlots={selectedSlots}
                pricing={pricing}
                turf={turf}
                onBook={handleBook}
                booking={booking}
              />

              {/* When no slots selected show hint */}
              {selectedSlots.length === 0 && (
                <button
                  disabled
                  className="w-full py-3 bg-[#0a1628] border border-[#1a3a5c] text-slate-500 font-extrabold rounded-xl text-sm tracking-wide cursor-not-allowed"
                >
                  ← Select slots to book
                </button>
              )}

              {/* Booking Error (desktop) */}
              {bookingError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  ⚠️ {bookingError}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TurfDetailsPage;