// Forgot.jsx
// Forgot password — sends reset LINK to email (not OTP)
// Backend: POST /auth/forgot-password → email mein reset link aata hai
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const Forgot = () => {
  const navigate = useNavigate();

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false); // show success state

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });

      // Backend always returns 200 (even if email not found — security)
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");

    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send reset link. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />
      <button
        onClick={() => navigate(-1)}
        className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center dark:bg-[#0d1f3c]/80 bg-white/80 backdrop-blur-md dark:border-[#1a3a5c] border-gray-200 border rounded-full dark:text-white text-gray-800 hover:border-green-500 hover:text-green-500 transition-all duration-200"
      >←</button>

      <div className="absolute inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-[380px] p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)]">

          {!sent ? (
            <>
              {/* ── Form State ── */}
              <div className="text-center mb-6">
                <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">🔑 Recovery</span>
                <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Forgot Password</h2>
                <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
              </div>

              <p className="dark:text-slate-400 text-slate-500 text-xs text-center mb-6 leading-relaxed">
                Enter your registered email and we'll send you a password reset link.
              </p>

              <div className="mb-5">
                <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="email"
                  className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
                />
              </div>

              <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reset Link →"}
              </button>
            </>
          ) : (
            <>
              {/* ── Success State ── */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5 text-2xl">
                  📧
                </div>
                <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">Check Email</span>
                <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-2">Reset Link Sent!</h2>
                <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mb-5" />

                <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed mb-2">
                  We sent a password reset link to:
                </p>
                <p className="dark:text-green-400 text-green-600 font-bold text-sm mb-5 break-all">{email}</p>

                <div className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-3 mb-6 text-xs dark:text-slate-400 text-slate-500 text-left leading-relaxed">
                  <p>💡 The link expires in <strong className="dark:text-white text-gray-800">1 hour</strong>.</p>
                  <p className="mt-1">📁 Check your <strong className="dark:text-white text-gray-800">spam/junk</strong> folder if not visible.</p>
                </div>

                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-2.5 rounded-xl dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 text-sm font-bold hover:border-green-500 hover:text-green-500 transition-colors mb-3"
                >
                  Try a different email
                </button>
              </div>
            </>
          )}

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-4">
            Remember your password?{" "}
            <Link to="/login" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forgot;