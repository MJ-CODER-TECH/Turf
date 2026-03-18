import { useState, useEffect } from 'react';
import { Search, Download, CreditCard, Smartphone, Building2, Wallet, RefreshCw, Eye, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const methodIcon = (method) => {
  const m = method?.toLowerCase() || '';
  if (m === 'upi')        return <Smartphone  size={13} className="text-purple-400" />;
  if (m === 'card')       return <CreditCard  size={13} className="text-blue-400" />;
  if (m === 'netbanking') return <Building2   size={13} className="text-orange-400" />;
  if (m === 'razorpay')   return <CreditCard  size={13} className="text-blue-400" />;
  return                         <Wallet      size={13} className="text-green-400" />;
};

const methodLabel = (method) => {
  const map = { razorpay: 'Razorpay', upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet', cash: 'Cash' };
  return map[method?.toLowerCase()] || method || '—';
};

const payStatusBadge = (status) => {
  const map = { paid: 'badge-green', pending: 'badge-yellow', refunded: 'badge-blue', failed: 'badge-red', partially_refunded: 'badge-yellow' };
  return <span className={map[status] || 'badge-blue'}>{status || '—'}</span>;
};

// Detail Modal
function PaymentModal({ booking, onClose }) {
  if (!booking) return null;
  const slots = booking.timeSlots?.length > 0
    ? booking.timeSlots.map(s => `${s.start}–${s.end}`).join(', ')
    : '—';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-200 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-display font-bold text-lg">Payment Details</h3>
          <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center">
            <X size={15} className="text-white/60" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Booking ID',    value: booking.bookingId },
            { label: 'Razorpay ID',   value: booking.razorpayPaymentId || '—' },
            { label: 'Razorpay Order',value: booking.razorpayOrderId || '—' },
            { label: 'Turf',          value: booking.turf?.name || '—' },
            { label: 'Date',          value: booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            { label: 'Slots',         value: slots },
            { label: 'Base Amount',   value: `₹${booking.amount?.base?.toLocaleString() || 0}` },
            { label: 'Taxes (18%)',   value: `₹${booking.amount?.taxes?.toLocaleString() || 0}` },
            { label: 'Discount',      value: `₹${booking.amount?.discount?.toLocaleString() || 0}` },
            { label: 'Total Paid',    value: `₹${booking.amount?.total?.toLocaleString() || 0}` },
            { label: 'Method',        value: methodLabel(booking.paymentMethod) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-white/40 text-xs flex-shrink-0">{label}</span>
              <span className="text-white text-xs font-medium text-right break-all">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-1 border-t border-white/5">
            <span className="text-white/40 text-xs">Pay Status</span>
            {payStatusBadge(booking.paymentStatus)}
          </div>
          {booking.refundAmount > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-300 text-xs">
                Refund: ₹{booking.refundAmount?.toLocaleString()} · Status: {booking.refundStatus || '—'}
              </p>
              {booking.refundId && (
                <p className="text-blue-300/60 text-xs mt-0.5 font-mono">{booking.refundId}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function Payments() {
  const { token } = useAuth();
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination]     = useState({ page: 1, total: 0, pages: 1 });
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page]);

 const fetchPayments = async () => {
  try {
    setLoading(true);
    setError('');

    // paymentStatus filter ke liye — backend status filter nahi karta
    // isliye hamesha sab fetch karo, phir client-side filter lagao
    const params = new URLSearchParams({
      page:  pagination.page,
      limit: 50,  // zyada fetch karo taaki filter karne pe kuch mile
    });

    const res  = await fetch(`${API_BASE}/admin/bookings?${params}`, {
      headers:     { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    const data = await res.json();

    if (data.success) {
      // pending hata do — sirf actual payment records rakhho
      const withPayments = data.data.filter(b => b.paymentStatus && b.paymentStatus !== 'pending');
      setPayments(withPayments);
      setPagination(p => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));
    } else {
      setError(data.message || 'Could not fetch payments.');
    }
  } catch {
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};
  // Client-side search
  const filtered = payments.filter(p => {
  const matchSearch = !search || (() => {
    const q = search.toLowerCase();
    return (
      p.bookingId?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.razorpayPaymentId?.toLowerCase().includes(q) ||
      p.turf?.name?.toLowerCase().includes(q)
    );
  })();

  // ← yahan paymentStatus check karo, booking status nahi
  const matchStatus = filterStatus === 'all' || p.paymentStatus === filterStatus;

  return matchSearch && matchStatus;
});

  // Revenue stats from current data
  const totalCollected = payments.filter(p => p.paymentStatus === 'paid').reduce((a, b) => a + (b.amount?.total || 0), 0);
  const totalRefunded  = payments.filter(p => p.paymentStatus === 'refunded').reduce((a, b) => a + (b.refundAmount || b.amount?.total || 0), 0);
  const totalFailed    = payments.filter(p => p.paymentStatus === 'failed').reduce((a, b) => a + (b.amount?.total || 0), 0);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Booking ID', 'User', 'Turf', 'Amount', 'Method', 'Pay Status', 'Date', 'Razorpay ID'],
      ...filtered.map(p => [
        p.bookingId || '',
        p.user?.name || '',
        p.turf?.name || '',
        p.amount?.total || 0,
        methodLabel(p.paymentMethod),
        p.paymentStatus || '',
        p.date ? new Date(p.date).toLocaleDateString('en-IN') : '',
        p.razorpayPaymentId || '',
      ])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Payments & Revenue</h2>
          <p className="text-white/40 text-sm">{pagination.total} total transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPayments} className="btn-ghost">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCSV} className="btn-ghost">
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Total Collected</p>
          <p className="text-primary-400 font-display font-bold text-2xl">₹{totalCollected.toLocaleString()}</p>
          <p className="text-white/25 text-xs mt-1">Paid transactions</p>
        </div>
        <div className="card p-5">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Refunded</p>
          <p className="text-blue-400 font-display font-bold text-2xl">₹{totalRefunded.toLocaleString()}</p>
          <p className="text-white/25 text-xs mt-1">Total refunds</p>
        </div>
        <div className="card p-5">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Failed</p>
          <p className="text-red-400 font-display font-bold text-2xl">₹{totalFailed.toLocaleString()}</p>
          <p className="text-white/25 text-xs mt-1">Failed transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex-1">
          <Search size={15} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by booking ID, user, Razorpay ID..."
            className="bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'paid', 'refunded', 'failed', 'partially_refunded'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                filterStatus === s ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchPayments} className="ml-auto text-xs underline">Retry</button>
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
                  <th className="table-header text-left hidden sm:table-cell">Razorpay ID</th>
                  <th className="table-header text-left">User</th>
                  <th className="table-header text-left hidden md:table-cell">Turf</th>
                  <th className="table-header text-left">Amount</th>
                  <th className="table-header text-left hidden md:table-cell">Method</th>
                  <th className="table-header text-left hidden lg:table-cell">Date</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="table-row">

                    {/* Booking ID */}
                    <td className="table-cell">
                      <span className="text-primary-400 font-mono text-xs font-semibold">
                        {p.bookingId || p._id?.slice(-8).toUpperCase()}
                      </span>
                    </td>

                    {/* Razorpay Payment ID */}
                    <td className="table-cell hidden sm:table-cell">
                      <span className="text-white/40 font-mono text-xs truncate max-w-[120px] block">
                        {p.razorpayPaymentId || '—'}
                      </span>
                    </td>

                    {/* User */}
                    <td className="table-cell">
                      <div>
                        <p className="text-white font-medium text-sm truncate max-w-[100px]">{p.user?.name || '—'}</p>
                        <p className="text-white/30 text-xs truncate max-w-[100px] hidden sm:block">{p.user?.phone || ''}</p>
                      </div>
                    </td>

                    {/* Turf */}
                    <td className="table-cell hidden md:table-cell">
                      <span className="text-white/60 text-sm truncate max-w-[130px] block">
                        {p.turf?.name || p.turfSnapshot?.name || '—'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="table-cell">
                      <p className="text-white font-semibold text-sm">₹{p.amount?.total?.toLocaleString() || 0}</p>
                      {p.refundAmount > 0 && (
                        <p className="text-blue-400 text-xs">-₹{p.refundAmount?.toLocaleString()}</p>
                      )}
                    </td>

                    {/* Method */}
                    <td className="table-cell hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {methodIcon(p.paymentMethod)}
                        <span className="text-white/60 text-sm">{methodLabel(p.paymentMethod)}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="table-cell hidden lg:table-cell text-white/40 text-xs">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    {/* Pay Status */}
                    <td className="table-cell">
                      {payStatusBadge(p.paymentStatus)}
                    </td>

                    {/* Action */}
                    <td className="table-cell">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="w-7 h-7 bg-white/5 hover:bg-primary-500/20 rounded-lg flex items-center justify-center transition-colors"
                        title="View details"
                      >
                        <Eye size={13} className="text-white/50" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty */}
          {filtered.length === 0 && !error && (
            <div className="py-16 text-center">
              <p className="text-white/20 text-4xl mb-3">💳</p>
              <p className="text-white/40">No payments found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-white/40 text-sm">
                Page {pagination.page} of {pagination.pages} · {pagination.total} records
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

      {/* Detail Modal */}
      <PaymentModal booking={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </div>
  );
}