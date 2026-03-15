// Otp.jsx
import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const Otp = () => {
  const navigate = useNavigate();
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (val && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0)
      inputs.current[index - 1]?.focus();
  };

  return (
    <div className="relative w-full h-screen">
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf" className="absolute w-full h-full object-cover"
      />
      <button onClick={() => navigate(-1)}
        className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center dark:bg-[#0d1f3c]/80 bg-white/80 backdrop-blur-md dark:border-[#1a3a5c] border-gray-200 border rounded-full dark:text-white text-gray-800 hover:border-green-500 hover:text-green-500 transition-all duration-200"
      >←</button>

      <div className="absolute inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-[380px] p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)]">

          <div className="text-center mb-6">
            <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">✉️ Verification</span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Verify OTP</h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
          </div>

          <p className="dark:text-slate-400 text-slate-500 text-xs text-center mb-7 leading-relaxed">
            Enter the 6-digit OTP sent to your email address
          </p>

          <div className="flex justify-between mb-7 gap-2">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                maxLength="1"
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-11 h-12 text-center rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 text-lg font-bold focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.2)] transition-all duration-200"
              />
            ))}
          </div>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

          <button className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200">
            Verify OTP →
          </button>

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-5">
            Didn't receive OTP?{" "}
            <span className="dark:text-green-400 text-green-600 font-bold cursor-pointer hover:text-green-500 transition-colors">Resend</span>
          </p>

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-2">
            <Link to="/login" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Otp;