import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Users, MapPin, IndianRupee, ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ── Helpers ────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
};

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
});

const SPORT_COLORS = {
  Football:    '#22c55e',
  Cricket:     '#3b82f6',
  Badminton:   '#8b5cf6',
  Basketball:  '#f59e0b',
  Tennis:      '#ec4899',
  'Box Cricket':'#06b6d4',
  'Multi-Sport':'#f97316',
};

// ── Sub-components ─────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, loading }) {
  return (
    <div className="stat-card group hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {sub !== undefined && (
          <div className="text-xs font-semibold rounded-lg px-2 py-1 bg-primary-500/15 text-primary-400">
            Today: {sub}
          </div>
        )}
      </div>
      <div>
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-white text-2xl font-display font-bold mt-1">{value}</p>
        )}
      </div>
      <p className="text-white/25 text-xs">Live data</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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

const statusBadge = (status) => {
  const map = { confirmed: 'badge-green', pending: 'badge-yellow', completed: 'badge-blue', cancelled: 'badge-red', 'no-show': 'badge-red' };
  return <span className={map[status] || 'badge-blue'}>{status}</span>;
};

// ── Main Component ─────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res  = await fetch(`${API_BASE}/admin/dashboard`, {
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Could not load dashboard.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived chart data from API ──────────────────────────

  // User growth: last 30 days → chart format
  const userGrowthChart = (data?.userGrowth || []).map(d => ({
    date:  d._id?.slice(5), // "MM-DD"
    users: d.count,
  }));

  // Top turfs → bar chart
  const topTurfsChart = (data?.topTurfs || []).map(t => ({
    name:     t.name?.length > 14 ? t.name.slice(0, 14) + '…' : t.name,
    bookings: t.totalBookings || 0,
    revenue:  t.totalRevenue  || 0,
  }));

  // Sport distribution from recent bookings
  const sportMap = {};
  (data?.recentBookings || []).forEach(b => {
    const sport = b.turfSnapshot?.sport || b.turf?.sport || 'Other';
    sportMap[sport] = (sportMap[sport] || 0) + 1;
  });
  const sportData = Object.entries(sportMap).map(([name, value]) => ({
    name, value, color: SPORT_COLORS[name] || '#6b7280'
  }));

  const stats = data?.stats;

  // ── Error state ──────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">{error}</p>
          <button onClick={fetchDashboard} className="btn-primary mt-4 mx-auto">
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{greeting()}</p>
          <h2 className="text-white font-display font-bold text-2xl">Here's what's happening today</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboard} className="btn-ghost" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="btn-ghost cursor-default">
            <Calendar size={15} className="text-primary-400" />
            <span className="text-white/60 text-sm">{today}</span>
          </div>
        </div>
      </div>

      {/* Pending verifications alert */}
      {stats?.pendingVerifications > 0 && (
        <div className="card p-4 border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            <span className="font-semibold">{stats.pendingVerifications} turf{stats.pendingVerifications > 1 ? 's' : ''}</span> pending verification
          </p>
          <button
            onClick={() => onNavigate?.('turfs')}
            className="text-yellow-400 text-xs font-semibold hover:text-yellow-300 transition-colors flex items-center gap-1"
          >
            Review <ArrowUpRight size={12} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={loading ? '—' : (stats?.totalBookings || 0).toLocaleString()}
          sub={loading ? '—' : stats?.todayBookings ?? 0}
          icon={Calendar}
          color="bg-primary-500"
          loading={loading}
        />
        <StatCard
          label="Total Revenue"
          value={loading ? '—' : `₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`}
          sub={loading ? '—' : `₹${((stats?.monthRevenue || 0) / 1000).toFixed(0)}k mo`}
          icon={IndianRupee}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          label="Total Users"
          value={loading ? '—' : (stats?.totalUsers || 0).toLocaleString()}
          icon={Users}
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard
          label="Active Turfs"
          value={loading ? '—' : (stats?.totalTurfs || 0).toLocaleString()}
          icon={MapPin}
          color="bg-orange-500"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 — User Growth + Sport Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* User Growth — 30 days */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">New User Registrations</h3>
              <p className="text-white/40 text-xs mt-0.5">Last 30 days</p>
            </div>
          </div>
          {loading ? (
            <div className="h-52 bg-white/3 rounded-xl animate-pulse" />
          ) : userGrowthChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={userGrowthChart}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2.5} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-white/20 text-sm">No registration data yet</p>
            </div>
          )}
        </div>

        {/* Sport Distribution from recent bookings */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="text-white font-semibold">Sport Distribution</h3>
            <p className="text-white/40 text-xs mt-0.5">Recent bookings by sport</p>
          </div>
          {loading ? (
            <div className="h-40 bg-white/3 rounded-xl animate-pulse" />
          ) : sportData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sportData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {sportData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n]}
                    contentStyle={{ background: '#131c2e', border: '1px solid #ffffff15', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sportData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-white/60 text-xs">{s.name}</span>
                    </div>
                    <span className="text-white text-xs font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-white/20 text-sm">No booking data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 — Top Turfs + Recent Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Top Turfs Bar Chart */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-1">Top Turfs</h3>
          <p className="text-white/40 text-xs mb-5">By total bookings</p>
          {loading ? (
            <div className="h-44 bg-white/3 rounded-xl animate-pulse" />
          ) : topTurfsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topTurfsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" fill="#22c55e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-white/20 text-sm">No turf data yet</p>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Bookings</h3>
            <button
              onClick={() => onNavigate?.('bookings')}
              className="text-primary-400 text-xs font-semibold flex items-center gap-1 hover:text-primary-300 transition-colors"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (data?.recentBookings || []).length > 0 ? (
            <div className="space-y-1">
              {(data.recentBookings).slice(0, 6).map(b => {
                const slot = b.timeSlots?.[0] || b.timeSlot;
                const initials = b.user?.name?.split(' ').map(n => n[0]).join('') || 'U';
                const dateStr  = b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

                return (
                  <div key={b._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                    <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-400 font-bold text-xs">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{b.user?.name || '—'}</p>
                      <p className="text-white/40 text-xs truncate">
                        {b.turf?.name || b.turfSnapshot?.name || '—'} · {dateStr}
                        {slot ? ` · ${slot.start}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-sm font-semibold">₹{b.amount?.total?.toLocaleString() || 0}</p>
                      {statusBadge(b.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">No recent bookings</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Turfs Revenue Table */}
      {!loading && (data?.topTurfs || []).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Top Performing Turfs</h3>
            <button
              onClick={() => onNavigate?.('turfs')}
              className="text-primary-400 text-xs font-semibold flex items-center gap-1 hover:text-primary-300 transition-colors"
            >
              Manage <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {data.topTurfs.map((t, i) => {
              const maxBookings = data.topTurfs[0]?.totalBookings || 1;
              const pct = Math.round(((t.totalBookings || 0) / maxBookings) * 100);
              return (
                <div key={t._id || i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs font-mono w-4">#{i + 1}</span>
                      <span className="text-white/80 text-sm truncate max-w-[180px]">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/40 text-xs">{t.totalBookings || 0} bookings</span>
                      <span className="text-primary-400 font-semibold text-sm">₹{((t.totalRevenue || 0) / 1000).toFixed(0)}k</span>
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
        </div>
      )}
    </div>
  );
}