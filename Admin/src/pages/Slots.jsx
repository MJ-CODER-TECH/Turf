import { useState, useEffect } from 'react';
import { Clock, Lock, Unlock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const slotColors = {
  available: 'bg-primary-500/15 border-primary-500/30 text-primary-400 hover:bg-primary-500/25 cursor-pointer',
  booked:    'bg-red-500/15 border-red-500/30 text-red-400 cursor-not-allowed opacity-70',
  past:      'bg-white/3 border-white/5 text-white/20 cursor-not-allowed',
};

export default function Slots() {
  const { token } = useAuth();

  // Turf list
  const [turfs, setTurfs]           = useState([]);
  const [turfsLoading, setTurfsLoading] = useState(true);

  // Selected controls
  const [selectedTurfId, setSelectedTurfId]     = useState('');
  const [selectedTurfName, setSelectedTurfName] = useState('');
  const [selectedDate, setSelectedDate]         = useState(new Date().toISOString().split('T')[0]);

  // Availability data
  const [slots, setSlots]       = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError]     = useState('');
  const [slotPrice, setSlotPrice]       = useState(0);

  // Fetch turfs on mount
  useEffect(() => {
    fetchTurfs();
  }, []);

  // Fetch availability when turf or date changes
  useEffect(() => {
    if (selectedTurfId && selectedDate) {
      fetchAvailability();
    }
  }, [selectedTurfId, selectedDate]);

  const fetchTurfs = async () => {
    try {
      setTurfsLoading(true);
      const res  = await fetch(`${API_BASE}/turfs?limit=50`, {
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setTurfs(data.data);
        setSelectedTurfId(data.data[0]._id);
        setSelectedTurfName(data.data[0].name);
      }
    } catch {
      // silently fail
    } finally {
      setTurfsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedTurfId) return;
    try {
      setSlotsLoading(true);
      setSlotsError('');

      const params = new URLSearchParams({ turfId: selectedTurfId, date: selectedDate });
      const res    = await fetch(`${API_BASE}/bookings/availability?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setSlots(data.data.slots || []);
        // Price from first available slot
        const first = data.data.slots?.find(s => s.price);
        if (first) setSlotPrice(first.price);
      } else {
        setSlotsError(data.message || 'Could not fetch availability.');
      }
    } catch {
      setSlotsError('Network error. Please try again.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Determine slot status for display
  const getSlotStatus = (slot) => {
    if (slot.isPast)      return 'past';
    if (!slot.available)  return 'booked';
    return 'available';
  };

  const getSlotLabel = (slot) => {
    if (slot.isPast)     return 'Past';
    if (!slot.available) return 'Booked';
    return 'Available';
  };

  // Format time display: "06:00" → "06:00 – 07:00"
  const formatSlotTime = (start) => {
    const [h] = start.split(':').map(Number);
    const end = `${String(h + 1).padStart(2, '0')}:00`;
    return { start, end, display: `${start} – ${end}` };
  };

  // Stats
  const available = slots.filter(s => s.available && !s.isPast).length;
  const booked    = slots.filter(s => !s.available && !s.isPast).length;
  const past      = slots.filter(s => s.isPast).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Time Slots Management</h2>
          <p className="text-white/40 text-sm">View availability for each turf by date</p>
        </div>
        <button
          onClick={fetchAvailability}
          disabled={slotsLoading || !selectedTurfId}
          className="btn-ghost"
        >
          <RefreshCw size={15} className={slotsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">
            Select Turf
          </label>
          {turfsLoading ? (
            <div className="input animate-pulse bg-white/5" />
          ) : (
            <select
              className="input"
              value={selectedTurfId}
              onChange={e => {
                const t = turfs.find(t => t._id === e.target.value);
                setSelectedTurfId(e.target.value);
                setSelectedTurfName(t?.name || '');
              }}
            >
              {turfs.map(t => (
                <option key={t._id} value={t._id} style={{ background: '#131c2e' }}>
                  {t.name} — {t.location?.city}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">
            Select Date
          </label>
          <input
            type="date"
            className="input"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center border-primary-500/20">
          <p className="text-primary-400 font-display font-bold text-2xl">
            {slotsLoading ? '—' : available}
          </p>
          <p className="text-white/40 text-xs mt-1">Available</p>
        </div>
        <div className="card p-4 text-center border-red-500/20">
          <p className="text-red-400 font-display font-bold text-2xl">
            {slotsLoading ? '—' : booked}
          </p>
          <p className="text-white/40 text-xs mt-1">Booked</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-white/30 font-display font-bold text-2xl">
            {slotsLoading ? '—' : past}
          </p>
          <p className="text-white/40 text-xs mt-1">Past / Expired</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Available', color: 'bg-primary-500' },
          { label: 'Booked',    color: 'bg-red-500' },
          { label: 'Past',      color: 'bg-white/20' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-sm ${l.color}`} />
            <span className="text-white/50 text-sm">{l.label}</span>
          </div>
        ))}
        {slotPrice > 0 && (
          <div className="ml-auto">
            <span className="text-white/40 text-xs">Base price: </span>
            <span className="text-primary-400 font-semibold text-sm">₹{slotPrice}/hr</span>
          </div>
        )}
      </div>

      {/* Error */}
      {slotsError && (
        <div className="card p-4 border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{slotsError}</p>
          <button onClick={fetchAvailability} className="ml-auto text-xs text-red-400 underline">
            Retry
          </button>
        </div>
      )}

      {/* Slot Grid */}
      {slotsLoading ? (
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : slots.length > 0 ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">
              Slots for{' '}
              <span className="text-primary-400">{selectedTurfName}</span>
            </h3>
            <p className="text-white/40 text-xs">
              {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {slots.map((slot, i) => {
              const status    = getSlotStatus(slot);
              const { display } = formatSlotTime(slot.start);

              return (
                <div
                  key={i}
                  className={`border rounded-xl p-3 transition-all ${slotColors[status]}`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} className="flex-shrink-0" />
                    <span className="text-xs font-semibold">{display}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs capitalize px-1.5 py-0.5 rounded-md ${
                      status === 'available' ? 'bg-primary-500/20 text-primary-300' :
                      status === 'booked'    ? 'bg-red-500/20 text-red-300' :
                                              'bg-white/5 text-white/20'
                    }`}>
                      {getSlotLabel(slot)}
                    </span>

                    {status === 'available' && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-primary-400">
                          ₹{slot.price || slotPrice}
                        </span>
                      </div>
                    )}

                    {status === 'booked' && (
                      <Lock size={11} className="text-red-400/60" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 flex-wrap">
            <p className="text-white/40 text-xs flex-1">
              {available} slots available · {booked} booked · {past} expired
            </p>
            <div className="w-full sm:w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: slots.length > 0 ? `${(available / slots.length) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-white/40 text-xs">
              {slots.length > 0 ? Math.round((available / slots.length) * 100) : 0}% free
            </p>
          </div>
        </div>
      ) : !slotsLoading && !slotsError && selectedTurfId ? (
        <div className="card p-16 text-center">
          <p className="text-white/20 text-5xl mb-3">🕐</p>
          <p className="text-white/40 font-medium">No slot data available</p>
          <p className="text-white/20 text-sm mt-1">Select a turf and date to view availability</p>
        </div>
      ) : null}

      {/* Info note */}
      {!slotsLoading && slots.length > 0 && (
        <div className="card p-4 bg-blue-500/5 border-blue-500/20">
          <p className="text-blue-300/70 text-xs">
            ℹ️ Slot availability is read-only in admin panel. Bookings are managed via the Bookings section. Past slots are automatically marked expired.
          </p>
        </div>
      )}
    </div>
  );
}