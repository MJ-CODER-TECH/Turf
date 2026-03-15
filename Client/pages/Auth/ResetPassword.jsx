// ResetPassword.jsx
// Route: /reset-password/:token
// User email se reset link click karta hai → naya password set karta hai
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.password || !form.confirmPassword) {
      toast.error("Please fill in all fields.");
      return false;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }
    if (!/\d/.test(form.password)) {
      toast.error("Password must contain at least one number.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleReset = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await axios.put(`${API}/auth/reset-password/${token}`, {
        password:        form.password,
        confirmPassword: form.confirmPassword,
      });

      // Backend auto-logs in after reset
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast.success("Password reset successfully! Logging you in...");
      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      const msg = err.response?.data?.message || "Password reset failed. The link may have expired.";
      toast.error(msg);
      // If token expired, send them back to forgot password
      if (err.response?.status === 400) {
        setTimeout(() => navigate("/forgot"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "New Password",     name: "password",        placeholder: "Min 8 characters + a number" },
    { label: "Confirm Password", name: "confirmPassword", placeholder: "Re-enter new password" },
  ];

  return (
    <div className="relative w-full h-screen">
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />
      <div className="absolute inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-[380px] p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)]">

          <div className="text-center mb-6">
            <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">🔒 Security</span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Reset Password</h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
            <p className="dark:text-slate-400 text-slate-500 text-xs mt-3">
              Choose a strong new password for your account.
            </p>
          </div>

          {fields.map((field) => (
            <div key={field.name} className="mb-3 relative">
              <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                {field.label}
              </label>
              <input
                type={showPass ? "text" : "password"}
                name={field.name}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                autoComplete="new-password"
                className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
              />
            </div>
          ))}

          {/* Show/Hide toggle */}
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="text-xs dark:text-slate-400 text-slate-500 hover:text-green-500 dark:hover:text-green-400 transition-colors mb-4"
          >
            {showPass ? "🙈 Hide passwords" : "👁 Show passwords"}
          </button>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Resetting...
              </span>
            ) : "Reset Password →"}
          </button>

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-5">
            <Link to="/login" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;