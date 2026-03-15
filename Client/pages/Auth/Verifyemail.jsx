// VerifyEmail.jsx
// Route: /verify-email/:token
// User email se link click karta hai → yeh page token verify karta hai → auto-login
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const VerifyEmail = () => {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await axios.get(`${API}/auth/verify-email/${token}`);

      // Backend auto-logs in user after verification
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      setStatus("success");
      setMessage(res.data.message || "Email verified successfully!");
      toast.success("Email verified! Welcome to TurfZone 🎉");

      // Redirect to home after 2.5 seconds
      setTimeout(() => navigate("/"), 2500);

    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed. The link may be invalid or expired.";
      setStatus("error");
      setMessage(msg);
      toast.error(msg);
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

          {/* ── LOADING ── */}
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <span className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin block" />
              </div>
              <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">Please Wait</span>
              <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-2">Verifying Email</h2>
              <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mb-5" />
              <p className="dark:text-slate-400 text-slate-500 text-sm">Confirming your email address...</p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5 text-2xl">
                ✅
              </div>
              <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">Verified!</span>
              <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-2">Email Confirmed</h2>
              <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mb-5" />
              <p className="dark:text-slate-400 text-slate-500 text-sm mb-5">{message}</p>
              <p className="dark:text-slate-500 text-slate-400 text-xs mb-6">
                Redirecting you to the home page...
              </p>
              <Link
                to="/"
                className="w-full inline-block py-3 rounded-xl bg-green-500 dark:text-[#0a1628] text-white font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors"
              >
                Go to Home →
              </Link>
            </>
          )}

          {/* ── ERROR ── */}
          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-2xl">
                ❌
              </div>
              <span className="text-red-400 text-[10px] font-bold tracking-[3px] uppercase">Failed</span>
              <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-1 mb-2">Verification Failed</h2>
              <div className="w-10 h-1 rounded-full bg-gradient-to-r from-red-400 to-red-600 mx-auto mb-5" />
              <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">{message}</p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/verify-pending"
                  className="w-full py-3 rounded-xl bg-green-500 dark:text-[#0a1628] text-white font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors text-center"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 rounded-xl dark:border-[#1a3a5c] border-gray-200 border dark:text-slate-400 text-slate-500 text-sm font-bold hover:border-green-500 hover:text-green-500 transition-colors text-center"
                >
                  Register Again
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;