import React from "react";
import { Link } from "react-router-dom";

const Login = () => {
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

      {/* Center Login Form */}
      <div className="relative z-10 flex items-center justify-center h-full">

        <div className="w-[380px] p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">

          {/* Title */}
          <h2 className="text-3xl font-semibold text-white text-center mb-6">
            Login
          </h2>

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none border border-white/20"
          />

          {/* Forgot */}
          <div className="text-right mb-4">
            <Link
              to="/forgot"
              className="text-sm text-gray-300 hover:text-white"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
            Login
          </button>

          {/* Register */}
          <p className="text-center text-gray-300 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-white font-semibold">
              Sign Up
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default Login;