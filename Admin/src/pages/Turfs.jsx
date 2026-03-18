import { useState, useEffect } from 'react';
import { Search, Plus, Star, MapPin, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function Turfs({ onNavigate }) {
  const { token } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTurfs();
  }, [pagination.page]);

  const fetchTurfs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 12,
        ...(search && { search }),
      });
      // Admin should see all turfs including inactive
      const res = await fetch(`${API_BASE}/turfs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setTurfs(data.data);
        setPagination(p => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));
      } else {
        setError(data.message || 'Could not fetch turfs.');
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
    fetchTurfs();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/turfs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setTurfs(prev => prev.filter(t => t._id !== id));
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to deactivate turf.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/turfs/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ isFeatured: false }),
      });
      const data = await res.json();
      if (data.success) {
        setTurfs(prev => prev.map(t => t._id === id ? { ...t, isVerified: true } : t));
      }
    } catch {
      alert('Failed to verify turf.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Turf Management</h2>
          <p className="text-white/40 text-sm">{pagination.total} turfs registered</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('add-turf')}>
          <Plus size={16} />
          Add Turf
        </button>
      </div>

      {/* Search + View Toggle */}
      <div className="card p-4 flex gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex-1">
          <Search size={15} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search turfs by name, city, sport..."
            className="bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        <button onClick={fetchTurfs} className="btn-ghost px-3" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex border border-white/10 rounded-xl overflow-hidden">
          <button onClick={() => setView('grid')} className={`px-4 py-2 text-sm transition-colors ${view === 'grid' ? 'bg-primary-500 text-white' : 'bg-transparent text-white/50 hover:bg-white/5'}`}>Grid</button>
          <button onClick={() => setView('list')} className={`px-4 py-2 text-sm transition-colors ${view === 'list' ? 'bg-primary-500 text-white' : 'bg-transparent text-white/50 hover:bg-white/5'}`}>List</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchTurfs} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Grid View */}
      {!loading && view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {turfs.map(t => (
            <div key={t._id} className="card p-0 overflow-hidden hover:border-white/10 transition-all group">
              {/* Image */}
              <div className="h-36 bg-gradient-to-br from-primary-500/20 to-blue-500/10 flex items-center justify-center relative overflow-hidden">
                {t.images?.[0]?.url ? (
                  <img src={t.images[0].url} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🏟️</span>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={t.isActive ? 'badge-green' : 'badge-red'}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {!t.isVerified && (
                    <span className="badge-yellow">Unverified</span>
                  )}
                  {t.badge && (
                    <span className="badge-blue">{t.badge}</span>
                  )}
                </div>
                {/* Action buttons on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!t.isVerified && (
                    <button
                      onClick={() => handleVerify(t._id)}
                      className="w-7 h-7 bg-primary-500/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-primary-500 transition-colors"
                      title="Verify Turf"
                    >
                      <span className="text-white text-xs font-bold">✓</span>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('edit-turf', t)}
                    className="w-7 h-7 bg-dark-300/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-primary-500/30 transition-colors"
                  >
                    <Edit2 size={12} className="text-white/70" />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id, t.name)}
                    disabled={deletingId === t._id}
                    className="w-7 h-7 bg-dark-300/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-white font-semibold truncate">{t.name}</h3>
                  <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                    <MapPin size={11} />
                    {t.location?.area}, {t.location?.city}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold text-sm">{t.rating?.average?.toFixed(1) || '0.0'}</span>
                    <span className="text-white/30 text-xs">({t.rating?.count || 0})</span>
                  </div>
                  <span className="text-primary-400 font-bold text-sm">₹{t.pricing?.weekday || t.price}/hr</span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/40">
                  <span className="badge-blue">{t.sport}</span>
                  <span>{t.type}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div>
                    <p className="text-white/30 text-xs">Bookings</p>
                    <p className="text-white font-semibold">{t.totalBookings || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">Revenue</p>
                    <p className="text-primary-400 font-semibold text-sm">
                      ₹{((t.totalRevenue || 0) / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('edit-turf', t)}
                    className="btn-primary flex-1 text-sm py-1.5"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  {!t.isVerified && (
                    <button
                      onClick={() => handleVerify(t._id)}
                      className="btn-ghost flex-1 text-sm py-1.5 text-primary-400"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Turf Card */}
          <div
            onClick={() => onNavigate('add-turf')}
            className="card p-0 overflow-hidden border-dashed border-white/10 hover:border-primary-500/40 transition-all cursor-pointer group min-h-[280px] flex items-center justify-center"
          >
            <div className="text-center p-8">
              <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500/20 transition-colors">
                <Plus size={24} className="text-primary-400" />
              </div>
              <p className="text-white/50 font-medium">Add New Turf</p>
              <p className="text-white/25 text-xs mt-1">Click to register a new turf</p>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && view === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header text-left">Turf</th>
                  <th className="table-header text-left hidden md:table-cell">Location</th>
                  <th className="table-header text-left hidden sm:table-cell">Sport</th>
                  <th className="table-header text-left">Price</th>
                  <th className="table-header text-left hidden lg:table-cell">Rating</th>
                  <th className="table-header text-left hidden xl:table-cell">Revenue</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {turfs.map(t => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary-500/10 flex-shrink-0">
                          {t.images?.[0]?.url
                            ? <img src={t.images[0].url} alt={t.name} className="w-full h-full object-cover" />
                            : <span className="text-lg flex items-center justify-center h-full">🏟️</span>
                          }
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-[140px]">{t.name}</p>
                          {!t.isVerified && <span className="badge-yellow text-xs">Unverified</span>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell text-white/50">
                      {t.location?.area}, {t.location?.city}
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="badge-blue">{t.sport}</span>
                    </td>
                    <td className="table-cell text-primary-400 font-semibold">
                      ₹{t.pricing?.weekday || t.price}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm">{t.rating?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden xl:table-cell text-primary-400 font-semibold">
                      ₹{((t.totalRevenue || 0) / 1000).toFixed(0)}k
                    </td>
                    <td className="table-cell">
                      <span className={t.isActive ? 'badge-green' : 'badge-red'}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onNavigate('edit-turf', t)}
                          className="w-7 h-7 bg-white/5 hover:bg-primary-500/20 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Edit2 size={12} className="text-white/50" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id, t.name)}
                          disabled={deletingId === t._id}
                          className="w-7 h-7 bg-white/5 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-white/40 text-sm">
                Page {pagination.page} of {pagination.pages} · {pagination.total} turfs
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

      {/* Empty state */}
      {!loading && turfs.length === 0 && !error && (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-3">🏟️</p>
          <p className="text-white/40 font-medium">No turfs found</p>
          <button onClick={() => onNavigate('add-turf')} className="btn-primary mt-4 mx-auto">
            <Plus size={15} /> Add First Turf
          </button>
        </div>
      )}
    </div>
  );
}