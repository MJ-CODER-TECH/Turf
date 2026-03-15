// Otp.jsx — Phone OTP verification (after login, for phone number verification)
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API     = import.meta.env.VITE_API_URL;
const OTP_LEN = 6;
const RESEND_COOLDOWN = 60; // seconds

const Otp = () => {
  const navigate  = useNavigate();
  const inputsRef = useRef([]);

  const [digits,     setDigits]     = useState(Array(OTP_LEN).fill(""));
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [cooldown,   setCooldown]   = useState(0);
  const [otpSent,    setOtpSent]    = useState(false);

  // ── Auto-start cooldown timer ──────────────────────────
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── Send OTP on mount ──────────────────────────────────
  useEffect(() => {
    handleSendOTP();
  }, []);

  const handleSendOTP = async () => {
    if (cooldown > 0) return;
    try {
      setSending(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/auth/send-otp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "OTP sent to your phone!");
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LEN).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      const data = err.response?.data;
      // Extract wait time from rate-limit message if present
      const msg = data?.message || "Could not send OTP. Please try again.";
      toast.error(msg);
      // If backend returns a cooldown, parse it
      const match = msg.match(/(\d+)\s*second/);
      if (match) setCooldown(parseInt(match[1]));
    } finally {
      setSending(false);
    }
  };

  // ── Handle single digit input ──────────────────────────
  const handleInput = (e, index) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);

    if (val && index < OTP_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (val && index === OTP_LEN - 1 && next.every((d) => d)) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0)          inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LEN - 1) inputsRef.current[index + 1]?.focus();
    if (e.key === "Enter") {
      const otp = digits.join("");
      if (otp.length === OTP_LEN) handleVerify(otp);
    }
  };

  // Handle paste (e.g. from SMS autofill)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LEN - 1);
    inputsRef.current[lastFilled]?.focus();
    if (pasted.length === OTP_LEN) handleVerify(pasted);
  };

  // ── Verify OTP ─────────────────────────────────────────
  const handleVerify = async (otpValue) => {
    const otp = otpValue ?? digits.join("");
    if (otp.length !== OTP_LEN) {
      toast.error(`Please enter all ${OTP_LEN} digits.`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/auth/verify-phone`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Phone number verified successfully! ✅");

      // Update stored user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.isPhoneVerified = true;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "OTP verification failed.";
      toast.error(msg);
      // Clear digits on wrong OTP
      setDigits(Array(OTP_LEN).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const allFilled = digits.every((d) => d !== "");

  return (
    <div className="relative w-full h-screen">
      {/* Background */}
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

          {/* Header */}
          <div className="text-center mb-7">
            <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">📱 Phone Verification</span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Verify OTP</h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
            <p className="dark:text-slate-400 text-slate-500 text-xs mt-3">
              {otpSent
                ? "Enter the 6-digit OTP sent to your registered phone number."
                : "Sending OTP to your phone..."}
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                disabled={loading}
                className={`
                  w-12 h-12 text-center text-lg font-extrabold rounded-lg
                  dark:bg-[#0a1628] bg-gray-50
                  border transition-colors duration-200
                  dark:text-white text-gray-800
                  focus:outline-none focus:border-green-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${digit
                    ? "dark:border-green-500 border-green-500"
                    : "dark:border-[#1a3a5c] border-gray-200"
                  }
                `}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || !allFilled}
            className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : "Verify OTP →"}
          </button>

          {/* Resend */}
          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-5">
            Didn't receive OTP?{" "}
            {cooldown > 0 ? (
              <span className="dark:text-slate-500 text-slate-400">
                Resend in{" "}
                <span className="dark:text-green-400 text-green-600 font-bold tabular-nums">
                  {cooldown}s
                </span>
              </span>
            ) : (
              <button
                onClick={handleSendOTP}
                disabled={sending}
                className="dark:text-green-400 text-green-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </p>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mt-5 mb-4" />

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs">
            <Link to="/login" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Otp;