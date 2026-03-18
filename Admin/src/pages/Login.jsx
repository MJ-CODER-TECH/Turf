import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Green glow top-left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
        {/* Blue glow bottom-right */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative">

        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg shadow-primary-500/30 mb-4">
            <span className="text-white font-display font-bold text-2xl">TZ</span>
          </div>
          <h1 className="text-white font-display font-bold text-3xl">TurfZone</h1>
          <p className="text-white/40 text-sm mt-1">Admin Portal</p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-200 border border-white/5 rounded-2xl p-8 shadow-2xl shadow-black/40">

          {/* Admin badge */}
          <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-xl px-4 py-2.5 mb-6">
            <Shield size={14} className="text-primary-400 flex-shrink-0" />
            <p className="text-primary-300 text-xs font-medium">Restricted access — Admins only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Mail size={15} className="text-white/25" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@turfzone.com"
                  autoComplete="email"
                  className="w-full bg-dark-50/60 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary-500/60 focus:bg-dark-50/80 transition-all duration-200 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Lock size={15} className="text-white/25" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-dark-50/60 border border-white/8 rounded-xl pl-10 pr-11 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary-500/60 focus:bg-dark-50/80 transition-all duration-200 text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={15} />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs mt-6">
          TurfZone Admin Panel · Authorized personnel only
        </p>
      </div>
    </div>
  );
}