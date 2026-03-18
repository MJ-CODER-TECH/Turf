import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, IndianRupee, Users, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const SPORT_COLORS = {
  Football: '#22c55e', Cricket: '#3b82f6', Badminton: '#8b5cf6',
  Basketball: '#f59e0b', Tennis: '#ec4899', 'Box Cricket': '#06b6d4', 'Multi-Sport': '#f97316',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-100 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-sm font-semibold">
            {p.dataKey === 'revenue' ? `₹${Number(p.value).toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { token } = useAuth();
  const [dashData,  setDashData]  = useState(null);
  const [bookings,  setBookings]  = useState([]);
  const [topTurfs,  setTopTurfs]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashRes, bookingsRes, turfsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
        }),
        fetch(`${API_BASE}/admin/bookings?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
        }),
        fetch(`${API_BASE}/turfs?limit=20&sort=popular`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
        }),
      ]);

      const [dash, book, turf] = await Promise.all([
        dashRes.json(), bookingsRes.json(), turfsRes.json()
      ]);

      if (dash.success)  setDashData(dash.data);
      if (book.success)  setBookings(book.data);
      if (turf.success)  setTopTurfs(turf.data.filter(t => t.totalRevenue > 0).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5));

    } catch {
      setError('Failed to load reports data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived Data ───────────────────────────────────────

  // Monthly revenue + bookings from userGrowth pattern
  // Build from bookings array: group by month
  const monthlyData = (() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.createdAt) return;
      const d = new Date(b.createdAt);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!map[key]) map[key] = { month: MONTHS[d.getMonth()], revenue: 0, bookings: 0 };
      map[key].revenue  += b.amount?.total || 0;
      map[key].bookings += 1;
    });
    return Object.values(map).slice(-6); // last 6 months
  })();

  // Bookings by day of week
  const bookingsByDay = (() => {
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    bookings.forEach(b => {
      if (!b.date) return;
      const day = DAYS[new Date(b.date).getDay()];
      counts[day]++;
    });
    return Object.entries(counts).map(([day, count]) => ({ day, count }));
  })();

  // Sport distribution from bookings
  const sportData = (() => {
    const map = {};
    bookings.forEach(b => {
      const sport = b.turfSnapshot?.sport || b.turf?.sport || 'Other';
      map[sport] = (map[sport] || 0) + 1;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
        color: SPORT_COLORS[name] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);
  })();

  // User growth from dashboard
  const userGrowthData = (dashData?.userGrowth || []).map(d => ({
    date:  d._id?.slice(5),
    users: d.count,
  }));

  // KPI calculations
  const stats        = dashData?.stats || {};
  const totalRevenue = stats.totalRevenue || 0;
  const totalBookings= stats.totalBookings || 0;
  const avgBookingVal= totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
  const totalSlots   = bookings.reduce((a, b) => a + (b.timeSlots?.length || 1), 0);

  // Days in dataset
  const daySet = new Set(bookings.map(b => b.date?.split('T')[0]).filter(Boolean));
  const avgPerDay = daySet.size > 0 ? Math.round(totalBookings / daySet.size) : 0;

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Month', 'Revenue', 'Bookings'],
      ...monthlyData.map(m => [m.month, m.revenue, m.bookings]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `turfzone_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-3">{error}</p>
          <button onClick={fetchAll} className="btn-primary mx-auto">
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Reports & Analytics</h2>
          <p className="text-white/40 text-sm">Real-time business performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} disabled={loading} className="btn-ghost">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCSV} className="btn-ghost">
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Avg Booking Value',
            value: loading ? '—' : `₹${avgBookingVal.toLocaleString()}`,
            sub: `${paidBookings.length} paid`,
            icon: IndianRupee,
            color: 'text-primary-400',
          },
          {
            label: 'Total Revenue',
            value: loading ? '—' : `₹${(totalRevenue / 100000).toFixed(2)}L`,
            sub: `This month: ₹${((stats.monthRevenue || 0) / 1000).toFixed(0)}k`,
            icon: TrendingUp,
            color: 'text-blue-400',
          },
          {
            label: 'Total Users',
            value: loading ? '—' : (stats.totalUsers || 0).toLocaleString(),
            sub: `Today: ${stats.todayBookings || 0} bookings`,
            icon: Users,
            color: 'text-purple-400',
          },
          {
            label: 'Avg Bookings/Day',
            value: loading ? '—' : avgPerDay,
            sub: `${totalSlots} total slots`,
            icon: Calendar,
            color: 'text-orange-400',
          },
        ].map((k, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/40 text-xs uppercase tracking-wider">{k.label}</p>
              <k.icon size={16} className={k.color} />
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <p className={`font-display font-bold text-2xl ${k.color}`}>{k.value}</p>
            )}
            <p className="text-white/30 text-xs font-medium mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Bookings Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Monthly Revenue Area */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Monthly Revenue</h3>
          <p className="text-white/40 text-xs mb-5">Revenue trend (last 6 months)</p>
          {loading ? (
            <div className="h-52 bg-white/3 rounded-xl animate-pulse" />
          ) : monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-white/20 text-sm">No revenue data yet</p>
            </div>
          )}
        </div>

        {/* Monthly Bookings Line */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Bookings per Month</h3>
          <p className="text-white/40 text-xs mb-5">Booking volume trend</p>
          {loading ? (
            <div className="h-52 bg-white/3 rounded-xl animate-pulse" />
          ) : monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-white/20 text-sm">No booking data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Pattern + Sport Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Bookings by Day */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Weekly Booking Pattern</h3>
          <p className="text-white/40 text-xs mb-5">Bookings by day of week</p>
          {loading ? (
            <div className="h-48 bg-white/3 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bookingsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sport Distribution Pie */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Sport Distribution</h3>
          <p className="text-white/40 text-xs mb-4">Bookings by sport type</p>
          {loading ? (
            <div className="h-48 bg-white/3 rounded-xl animate-pulse" />
          ) : sportData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sportData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {sportData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v}% (${sportData.find(s => s.name === n)?.count || 0})`, n]}
                    contentStyle={{ background: '#131c2e', border: '1px solid #ffffff15', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {sportData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-white/60 text-xs truncate">{s.name}</span>
                    <span className="text-white text-xs font-semibold ml-auto">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-white/20 text-sm">No sport data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* User Growth + Top Turfs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* User Growth 30 days */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">User Registrations</h3>
          <p className="text-white/40 text-xs mb-5">New users — last 30 days</p>
          {loading ? (
            <div className="h-48 bg-white/3 rounded-xl animate-pulse" />
          ) : userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#userGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-white/20 text-sm">No registration data yet</p>
            </div>
          )}
        </div>

        {/* Top Performing Turfs */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Top Performing Turfs</h3>
          <p className="text-white/40 text-xs mb-5">By revenue generated</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topTurfs.length > 0 ? (
            <div className="space-y-4">
              {topTurfs.map((t, i) => {
                const maxRev = topTurfs[0]?.totalRevenue || 1;
                const pct    = Math.round(((t.totalRevenue || 0) / maxRev) * 100);
                return (
                  <div key={t._id || i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs font-mono w-4">#{i + 1}</span>
                        <div className="w-6 h-6 rounded-md overflow-hidden bg-primary-500/10 flex-shrink-0">
                          {t.images?.[0]?.url
                            ? <img src={t.images[0].url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xs flex items-center justify-center h-full">🏟</span>
                          }
                        </div>
                        <span className="text-white/80 text-sm truncate max-w-[140px]">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-white/30 text-xs">{t.totalBookings || 0} bk</span>
                        <span className="text-primary-400 font-semibold text-sm">
                          ₹{((t.totalRevenue || 0) / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-white/20 text-sm">No turf revenue data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}