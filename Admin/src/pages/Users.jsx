import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Ban, Eye, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function Users() {
  const { token } = useAuth();
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination]     = useState({ page: 1, total: 0, pages: 1 });
  const [togglingId, setTogglingId]     = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page:  pagination.page,
        limit: 20,
        ...(search && { search }),
      });

      const res  = await fetch(`${API_BASE}/users?${params}`, {
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        // Filter by isActive if needed (backend supports role filter but not isActive directly)
        let result = data.data;
        if (filterStatus === 'active')   result = result.filter(u => u.isActive);
        if (filterStatus === 'inactive') result = result.filter(u => !u.isActive);
        setUsers(result);
        setPagination(p => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));
      } else {
        setError(data.message || 'Could not fetch users.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  // Toggle active/inactive via PUT /admin/users/:id/toggle
  const handleToggle = async (id, currentStatus, name) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${name}"?`)) return;
    setTogglingId(id);
    try {
      const res  = await fetch(`${API_BASE}/admin/users/${id}/toggle`, {
        method:      'PUT',
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to toggle user status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Delete via DELETE /users/:id
  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res  = await fetch(`${API_BASE}/users/${id}`, {
        method:      'DELETE',
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        setPagination(p => ({ ...p, total: p.total - 1 }));
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  // Derived stats from current page (real totals come from API)
  const activeCount   = users.filter(u => u.isActive).length;
  const totalBookings = users.reduce((a, u) => a + (u.totalBookings || 0), 0);
  const totalSpent    = users.reduce((a, u) => a + (u.totalSpent    || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Users Management</h2>
          <p className="text-white/40 text-sm">{pagination.total} registered users</p>
        </div>
        <button onClick={fetchUsers} className="btn-ghost">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-white font-display font-bold text-2xl">{pagination.total}</p>
          <p className="text-white/40 text-xs mt-1">Total Users</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-primary-400 font-display font-bold text-2xl">{totalBookings}</p>
          <p className="text-white/40 text-xs mt-1">Bookings (this page)</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-blue-400 font-display font-bold text-2xl">
            ₹{(totalSpent / 1000).toFixed(0)}k
          </p>
          <p className="text-white/40 text-xs mt-1">Revenue (this page)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex-1">
          <Search size={15} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
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
          <button onClick={fetchUsers} className="ml-auto text-xs underline">Retry</button>
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
                  <th className="table-header text-left">User</th>
                  <th className="table-header text-left hidden md:table-cell">Contact</th>
                  <th className="table-header text-left hidden lg:table-cell">Sport</th>
                  <th className="table-header text-left">Bookings</th>
                  <th className="table-header text-left hidden sm:table-cell">Spent</th>
                  <th className="table-header text-left hidden xl:table-cell">Joined</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="table-row">
                    {/* User */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                          {u.avatar?.url ? (
                            <img src={u.avatar.url} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-500/30 to-blue-500/20 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.name}</p>
                          <p className="text-white/30 text-xs font-mono">{u._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="table-cell hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Mail size={11} />{u.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Phone size={11} />{u.phone}
                        </div>
                      </div>
                    </td>

                    {/* Sport */}
                    <td className="table-cell hidden lg:table-cell">
                      <span className="text-white/50 text-sm">{u.favouriteSport || '—'}</span>
                    </td>

                    {/* Bookings */}
                    <td className="table-cell">
                      <span className="text-white font-semibold">{u.totalBookings || 0}</span>
                    </td>

                    {/* Spent */}
                    <td className="table-cell hidden sm:table-cell">
                      <span className="text-primary-400 font-semibold">
                        ₹{(u.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="table-cell hidden xl:table-cell text-white/40 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggle(u._id, u.isActive, u.name)}
                          disabled={togglingId === u._id}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                            u.isActive
                              ? 'bg-white/5 hover:bg-red-500/20'
                              : 'bg-white/5 hover:bg-primary-500/20'
                          }`}
                        >
                          {togglingId === u._id ? (
                            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                          ) : u.isActive ? (
                            <Ban size={13} className="text-red-400" />
                          ) : (
                            <CheckCircle size={13} className="text-primary-400" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={deletingId === u._id}
                          title="Delete user"
                          className="w-7 h-7 bg-white/5 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          {deletingId === u._id ? (
                            <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <XCircle size={13} className="text-red-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty */}
          {users.length === 0 && !error && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-white/40">No users found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-white/40 text-sm">
                Page {pagination.page} of {pagination.pages} · {pagination.total} users
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
    </div>
  );
}