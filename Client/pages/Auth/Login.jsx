// Login.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  // If redirected here after session expiry
  const sessionExpired = new URLSearchParams(location.search).get("session") === "expired";
  React.useEffect(() => {
    if (sessionExpired) toast.warn("Session expired. Please log in again.");
  }, [sessionExpired]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);

      const res = await axios.post(`${API}/auth/login`, { email: email.trim(), password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));

      toast.success(`Welcome back, ${res.data.user.name}! 👋`);

      // Redirect to page they were trying to visit, else home
      const from = location.state?.from || "/";
      navigate(from, { replace: true });

    } catch (err) {
      const data = err.response?.data;

      if (data?.requiresVerification) {
        toast.warn("Please verify your email first. Check your inbox.");
        navigate("/verify-pending", { state: { email: data.email || email.trim() } });
        return;
      }

      toast.error(data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
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
        className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center dark:bg-[#0d1f3c]/80 bg-white/80 backdrop-blur-md dark:border-[#1a3a5c] border-gray-200 border rounded-full dark:text-white text-gray-800 hover:border-green-500 hover:text-green-500 dark:hover:text-green-400 transition-all duration-200"
      >←</button>

      <div className="absolute inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-full max-w-[380px] mx-4 p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)]">

          <div className="text-center mb-7">
            <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">⚽ Welcome Back</span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Login</h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
          </div>

          <div className="mb-3">
            <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
            />
          </div>

          <div className="mb-2">
            <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
            />
          </div>

          <div className="text-right mb-5">
            <Link to="/forgot" className="text-xs dark:text-slate-400 text-slate-500 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200">
              Forgot Password?
            </Link>
          </div>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : "Login →"}
          </button>

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;