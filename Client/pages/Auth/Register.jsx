// Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const Register = () => {
  const navigate = useNavigate();

  const SPORTS = ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Box Cricket', 'Other'];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    favouriteSport: "Football",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const { name, email, phone, password, confirmPassword } = form;
    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return false;
    }
    if (!/^[a-zA-Z ]{2,50}$/.test(name.trim())) {
      toast.error("Name must be 2–50 characters (letters only).");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!/^(\+91|91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }
    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await axios.post(`${API}/auth/register`, {
        name:           form.name.trim(),
        email:          form.email.trim(),
        phone:          form.phone.trim(),
        password:       form.password,
        favouriteSport: form.favouriteSport || "Football",
      });

      // New flow: user is NOT logged in yet — they must verify email first
      toast.info("📧 Verification email sent! Please check your inbox to activate your account.", {
        autoClose: 6000,
      });
      navigate("/verify-pending", { state: { email: form.email.trim() } });

    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(e.msg));
      } else {
        toast.error(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  const fields = [
    { label: "Full Name",        name: "name",            type: "text",     placeholder: "Enter your full name" },
    { label: "Email Address",    name: "email",           type: "email",    placeholder: "Enter your email" },
    { label: "Phone Number",     name: "phone",           type: "tel",      placeholder: "10-digit mobile number" },
    { label: "Password",         name: "password",        type: "password", placeholder: "Min 8 characters + a number" },
    { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Re-enter your password" },
  ];

  return (
    <div className="relative w-full min-h-screen">
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="fixed w-full h-full object-cover"
      />

      <button
        onClick={() => navigate(-1)}
        className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center dark:bg-[#0d1f3c]/80 bg-white/80 backdrop-blur-md dark:border-[#1a3a5c] border-gray-200 border rounded-full dark:text-white text-gray-800 hover:border-green-500 hover:text-green-500 transition-all duration-200"
      >←</button>

      <div className="fixed inset-0 dark:bg-[#0a1628]/70 bg-black/30" />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-10 px-4">
        <div className="w-full max-w-[420px] p-8 rounded-2xl dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md dark:border-[#1a3a5c] border-white/30 border shadow-[0_0_40px_rgba(0,0,0,0.2)]">

          <div className="text-center mb-7">
            <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[3px] uppercase">⚽ Join Us</span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-1">Create Account</h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-2" />
          </div>

          {fields.map((field) => (
            <div key={field.name} className="mb-3">
              <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete={field.name === "password" || field.name === "confirmPassword" ? "new-password" : "on"}
                className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
              />
            </div>
          ))}

          {/* Favourite Sport Dropdown */}
          <div className="mb-3">
            <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
              Favourite Sport
            </label>
            <select
              name="favouriteSport"
              value={form.favouriteSport}
              onChange={handleChange}
              className="w-full p-3 rounded-lg dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 text-sm focus:outline-none focus:border-green-500 transition-colors duration-200 cursor-pointer"
            >
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 my-4" />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-green-500 dark:text-[#0a1628] text-white py-3 rounded-xl font-extrabold text-sm tracking-wide hover:bg-green-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : "Create Account →"}
          </button>

          <p className="text-center dark:text-slate-400 text-slate-500 text-xs mt-5">
            Already have an account?{" "}
            <Link to="/login" className="dark:text-green-400 text-green-600 font-bold hover:text-green-500 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;