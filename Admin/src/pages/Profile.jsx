import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Shield, Calendar, LogOut,
  BookOpen, IndianRupee, Star, Edit2, Check, X, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function Profile() {
  const { user: authUser, token, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password change state
  const [showPassForm, setShowPassForm] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setUser(data.data);
      else setError('Could not load profile.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPassLoading(true);
    setPassMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(passForm),
      });
      const data = await res.json();
      if (data.success) {
        setPassMsg({ type: 'success', text: data.message });
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPassForm(false);
      } else {
        setPassMsg({ type: 'error', text: data.message });
      }
    } catch {
      setPassMsg({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchProfile} className="btn-primary mt-4 mx-auto">Retry</button>
      </div>
    );
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-white font-display font-bold text-xl">Admin Profile</h2>
        <p className="text-white/40 text-sm">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-primary-500/20 border-2 border-primary-500/30 flex items-center justify-center overflow-hidden">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-400 font-display font-bold text-2xl">{initials}</span>
              )}
            </div>
            {/* Admin badge */}
            <div className="absolute -bottom-2 -right-2 bg-primary-500 rounded-lg px-2 py-0.5">
              <span className="text-white text-xs font-bold">ADMIN</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-display font-bold text-2xl">{user?.name}</h3>
            <p className="text-white/40 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-green">Active</span>
              {user?.isEmailVerified && <span className="badge-blue">Email Verified</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="card p-6 space-y-4">
        <h4 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Account Details</h4>

        {[
          { icon: User,     label: 'Full Name',   value: user?.name },
          { icon: Mail,     label: 'Email',        value: user?.email },
          { icon: Phone,    label: 'Phone',        value: user?.phone || '—' },
          { icon: Shield,   label: 'Role',         value: user?.role?.toUpperCase() },
          { icon: Calendar, label: 'Joined',       value: joinDate },
          { icon: Calendar, label: 'Last Login',   value: lastLogin },
          { icon: BookOpen, label: 'Login Count',  value: user?.loginCount || 0 },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-xs">{label}</p>
              <p className="text-white text-sm font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold text-sm">Change Password</h4>
          <button
            onClick={() => { setShowPassForm(p => !p); setPassMsg({ type: '', text: '' }); }}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            <KeyRound size={13} />
            {showPassForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {passMsg.text && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${passMsg.type === 'success' ? 'bg-primary-500/10 border border-primary-500/20 text-primary-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
            {passMsg.type === 'success' ? <Check size={14} /> : <X size={14} />}
            {passMsg.text}
          </div>
        )}

        {showPassForm && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword',     label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-white/40 text-xs font-medium block mb-1.5">{label}</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={passForm[key]}
                  onChange={e => setPassForm(p => ({ ...p, [key]: e.target.value }))}
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={passLoading} className="btn-primary w-full justify-center">
              {passLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
              ) : (
                <><Check size={14} /> Update Password</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Logout */}
      <div className="card p-4">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 transition-colors group"
        >
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
            <LogOut size={15} className="text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-red-400 font-semibold text-sm">Logout</p>
            <p className="text-white/30 text-xs">Sign out from admin panel</p>
          </div>
        </button>
      </div>
    </div>
  );
}