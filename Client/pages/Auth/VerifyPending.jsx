// VerifyPending.jsx — Shown after register, asks user to check email
// Route: /verify-pending
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API             = import.meta.env.VITE_API_URL;
const RESEND_COOLDOWN = 60;

const VerifyPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email    = location.state?.email || "";

  const [sending,  setSending]  = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    let timer;
    if (cooldown > 0) timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not found. Please register again.");
      navigate("/register");
      return;
    }
    try {
      setSending(true);
      await axios.post(`${API}/auth/resend-verification`, { email });
      toast.success("Verification email resent! Check your inbox.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not resend email.";
      toast.error(msg);
      const match = msg.match(/(\d+)\s*second/);
      if (match) setCooldown(parseInt(match[1]));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />
      <div className="absolute inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-[400px] p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)] text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5 text-2xl">
            📧
          </div>

          <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">Almost There!</span>
          <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-2">Check Your Email</h2>
          <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mb-5" />

          <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed mb-2">
            We sent a verification link to:
          </p>
          {email && (
            <p className="dark:text-green-400 text-green-600 font-bold text-sm mb-5 break-all">
              {email}
            </p>
          )}
          <p className="dark:text-slate-400 text-slate-500 text-xs leading-relaxed mb-6">
            Click the link in the email to activate your account. The link expires in <strong className="dark:text-white text-gray-800">24 hours</strong>.
          </p>

          <div className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-3 mb-6 text-xs dark:text-slate-400 text-slate-500">
            💡 Check your <strong className="dark:text-white text-gray-800">spam/junk</strong> folder if you don't see it.
          </div>

          {/* Resend */}
          <p className="dark:text-slate-400 text-slate-500 text-xs mb-4">
            Didn't receive it?{" "}
            {cooldown > 0 ? (
              <span>
                Resend in{" "}
                <span className="dark:text-green-400 text-green-600 font-bold tabular-nums">{cooldown}s</span>
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="dark:text-green-400 text-green-600 font-bold hover:underline disabled:opacity-50"
              >
                {sending ? "Sending..." : "Resend Email"}
              </button>
            )}
          </p>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

          <div className="flex gap-3">
            <Link
              to="/register"
              className="flex-1 py-2.5 rounded-xl dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 text-xs font-bold hover:border-green-500 hover:text-green-500 transition-colors text-center"
            >
              ← Register Again
            </Link>
            <Link
              to="/login"
              className="flex-1 py-2.5 rounded-xl bg-green-500 dark:text-[#0a1628] text-white text-xs font-extrabold hover:bg-green-400 transition-colors text-center"
            >
              Go to Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPending;