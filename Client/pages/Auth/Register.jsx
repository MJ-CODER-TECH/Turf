import React from "react";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="relative w-full h-screen">

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Center Register Form */}
      <div className="relative z-10 flex items-center justify-center h-full">

        <div className="w-[420px] p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">

          {/* Title */}
          <h2 className="text-3xl font-semibold text-white text-center mb-6">
            Create Account
          </h2>

          {/* Name */}
          <input
            type="text"
            placeholder="Full Name"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Phone */}
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full mb-5 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Register Button */}
          <button className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
            Register
          </button>

          {/* Login Redirect */}
          <p className="text-center text-gray-300 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-semibold">
              Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default Register;