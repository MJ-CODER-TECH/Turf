import { useState, useEffect } from 'react';
import { Search, Eye, Check, X, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const statusColors = {
  confirmed:  'badge-green',
  pending:    'badge-yellow',
  completed:  'badge-blue',
  cancelled:  'badge-red',
  'no-show':  'badge-red',
};

// Booking Detail Modal
function BookingModal({ booking, onClose }) {
  if (!booking) return null;

  const slots = booking.timeSlots?.length > 0
    ? booking.timeSlots.map(s => `${s.start} – ${s.end}`).join(', ')
    : booking.timeSlot
      ? `${booking.timeSlot.start} – ${booking.timeSlot.end}`
      : '—';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-200 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-display font-bold text-lg">Booking Details</h3>
          <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors">
            <X size={15} className="text-white/60" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Booking ID',   value: booking.bookingId },
            { label: 'User',         value: booking.user?.name || '—' },
            { label: 'Email',        value: booking.user?.email || '—' },
            { label: 'Phone',        value: booking.user?.phone || '—' },
            { label: 'Turf',         value: booking.turf?.name || booking.turfSnapshot?.name || '—' },
            { label: 'City',         value: booking.turf?.location?.city || booking.turfSnapshot?.city || '—' },
            { label: 'Sport',        value: booking.turfSnapshot?.sport || '—' },
            { label: 'Date',         value: booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            { label: 'Slots',        value: slots },
            { label: 'Duration',     value: booking.duration ? `${booking.duration} mins` : '—' },
            { label: 'Players',      value: booking.players || '—' },
            { label: 'Amount',       value: `₹${booking.amount?.total?.toLocaleString() || 0}` },
            { label: 'Payment',      value: booking.paymentMethod || '—' },
            { label: 'Pay Status',   value: booking.paymentStatus || '—' },
            { label: 'Booked On',    value: new Date(booking.createdAt).toLocaleString('en-IN') },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-white/40 text-xs flex-shrink-0">{label}</span>
              <span className="text-white text-xs font-medium text-right break-all">{value}</span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-1">
            <span className="text-white/40 text-xs">Status</span>
            <span className={statusColors[booking.status] || 'badge-blue'}>{booking.status}</span>
          </div>

          {booking.cancellationReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-2">
              <p className="text-red-300 text-xs"><span className="font-semibold">Reason: </span>{booking.cancellationReason}</p>
              {booking.refundAmount > 0 && (
                <p className="text-red-300 text-xs mt-1">Refund: ₹{booking.refundAmount} ({booking.refundStatus})</p>
              )}
            </div>
          )}

          {booking.adminNote && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs"><span className="font-semibold text-white/80">Note: </span>{booking.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Bookings() {
  const { token } = useAuth();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate]     = useState('');
  const [pagination, setPagination]     = useState({ page: 1, total: 0, pages: 1 });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, filterStatus, filterDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page:  pagination.page,
        limit: 20,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDate && { date: filterDate }),
      });

      const res  = await fetch(`${API_BASE}/admin/bookings?${params}`, {
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setBookings(data.data);
        setPagination(p => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));
      } else {
        setError(data.message || 'Could not fetch bookings.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter (booking ID / user name)
  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.bookingId?.toLowerCase().includes(q) ||
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.turf?.name?.toLowerCase().includes(q) ||
      b.turfSnapshot?.name?.toLowerCase().includes(q)
    );
  });

  const handleCancel = async (id, bookingRef) => {
    if (!confirm(`Cancel booking ${bookingRef}?`)) return;
    setCancellingId(id);
    try {
      const res  = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
        method:      'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelled by admin' }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
        setSelectedBooking(null);
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  // Format slots display
  const formatSlots = (b) => {
    if (b.timeSlots?.length > 0) {
      if (b.timeSlots.length === 1) return `${b.timeSlots[0].start} – ${b.timeSlots[0].end}`;
      return `${b.timeSlots[0].start} (${b.timeSlots.length} slots)`;
    }
    if (b.timeSlot) return `${b.timeSlot.start} – ${b.timeSlot.end}`;
    return '—';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Bookings Management</h2>
          <p className="text-white/40 text-sm">{pagination.total} total bookings</p>
        </div>
        <button onClick={fetchBookings} className="btn-ghost self-start">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex-1">
            <Search size={15} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by booking ID, user, turf..."
              className="bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Date filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
            <Calendar size={14} className="text-white/30 flex-shrink-0" />
            <input
              type="date"
              className="bg-transparent text-white/60 text-sm focus:outline-none"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-white/30 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled', 'no-show'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                filterStatus === s ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchBookings} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header text-left">Booking ID</th>
                  <th className="table-header text-left">User</th>
                  <th className="table-header text-left hidden md:table-cell">Turf</th>
                  <th className="table-header text-left hidden lg:table-cell">Date & Slots</th>
                  <th className="table-header text-left hidden sm:table-cell">Amount</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b._id} className="table-row">

                    {/* Booking ID */}
                    <td className="table-cell">
                      <span className="text-primary-400 font-mono text-xs font-semibold">
                        {b.bookingId || b._id?.slice(-8).toUpperCase()}
                      </span>
                    </td>

                    {/* User */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-400 text-xs font-bold">
                            {b.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate max-w-[110px]">{b.user?.name || '—'}</p>
                          <p className="text-white/30 text-xs truncate max-w-[110px] hidden sm:block">{b.user?.phone || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Turf */}
                    <td className="table-cell hidden md:table-cell">
                      <p className="text-white/70 text-sm truncate max-w-[150px]">
                        {b.turf?.name || b.turfSnapshot?.name || '—'}
                      </p>
                      <p className="text-white/30 text-xs">
                        {b.turf?.location?.city || b.turfSnapshot?.city || ''}
                      </p>
                    </td>

                    {/* Date & Slots */}
                    <td className="table-cell hidden lg:table-cell">
                      <p className="text-white/70 text-xs">
                        {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                      <p className="text-white/40 text-xs">{formatSlots(b)}</p>
                    </td>

                    {/* Amount */}
                    <td className="table-cell hidden sm:table-cell">
                      <p className="text-white font-semibold text-sm">₹{b.amount?.total?.toLocaleString() || 0}</p>
                      <p className="text-white/30 text-xs capitalize">{b.paymentStatus || ''}</p>
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span className={statusColors[b.status] || 'badge-blue'}>{b.status}</span>
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {/* View */}
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="w-7 h-7 bg-white/5 hover:bg-primary-500/20 rounded-lg flex items-center justify-center transition-colors"
                          title="View details"
                        >
                          <Eye size={13} className="text-white/50" />
                        </button>

                        {/* Cancel (confirmed/pending only) */}
                        {['confirmed', 'pending'].includes(b.status) && (
                          <button
                            onClick={() => handleCancel(b._id, b.bookingId)}
                            disabled={cancellingId === b._id}
                            className="w-7 h-7 bg-red-500/10 hover:bg-red-500/25 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Cancel booking"
                          >
                            {cancellingId === b._id
                              ? <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              : <X size={13} className="text-red-400" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty */}
          {filtered.length === 0 && !error && (
            <div className="py-16 text-center">
              <p className="text-white/20 text-4xl mb-3">📋</p>
              <p className="text-white/40">No bookings found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-white/40 text-sm">
                Page {pagination.page} of {pagination.pages} · {pagination.total} bookings
              </p>
              <div className="flex gap-1">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}