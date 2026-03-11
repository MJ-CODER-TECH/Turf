import React from "react";
import { Link } from "react-router-dom";

const Otp = () => {
  return (
    <div className="relative w-full h-screen">

      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20"></div>

      {/* Center Form */}
      <div className="relative z-10 flex items-center justify-center h-full">

        <div className="w-[380px] p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">

          <h2 className="text-3xl text-white font-semibold text-center mb-4">
            Verify OTP
          </h2>

          <p className="text-gray-300 text-sm text-center mb-6">
            Enter the OTP sent to your email
          </p>

          {/* OTP Inputs */}
          <div className="flex justify-between mb-6">

            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>
            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>
            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>
            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>
            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>
            <input className="w-12 h-12 text-center rounded-lg bg-white/20 border border-white/20 text-white text-lg" maxLength="1"/>

          </div>

          {/* Verify Button */}
          <button className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
            Verify OTP
          </button>

          <p className="text-center text-gray-300 text-sm mt-5">
            Didn't receive OTP? <span className="text-white cursor-pointer">Resend</span>
          </p>

          <p className="text-center text-gray-300 text-sm mt-2">
            <Link to="/login" className="text-white font-semibold">
              Back to Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default Otp;