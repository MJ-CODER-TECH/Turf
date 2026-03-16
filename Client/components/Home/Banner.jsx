import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const SPORT_TYPES = [
  { value: "Football",   label: "⚽ Football" },
  { value: "Cricket",    label: "🏏 Cricket" },
  { value: "Badminton",  label: "🏸 Badminton" },
  { value: "Tennis",     label: "🎾 Tennis" },
  { value: "Hockey",     label: "🏑 Hockey" },
  { value: "Basketball", label: "🏀 Basketball" },
];

const getTodayStr = () => new Date().toISOString().split("T")[0];

const Banner = () => {
  const navigate = useNavigate();

  const [cities, setCities]           = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Shared form state — dono mobile aur desktop same state use karte hain
  const [form, setForm] = useState({
    sport: "",
    city:  "",
    date:  getTodayStr(),
    time:  "",
  });

  // Cities DB se fetch karo
  useEffect(() => {
    axios.get(`${API_BASE_URL}/turfs/cities`)
      .then(({ data }) => {
        if (data.success) setCities(data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (form.sport) params.set("sport", form.sport);
    if (form.city)  params.set("city",  form.city);
    if (form.date)  params.set("date",  form.date);
    navigate(`/turfs?${params.toString()}`);
  };

  return (
    <section className="relative w-full h-screen">

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 max-w-7xl mx-auto h-full flex items-center justify-between px-4 lg:px-6">

        {/* LEFT CONTENT */}
        <div className="text-white max-w-xl w-full sm:w-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4 md:mb-6">
            <span className="block">Choose Your Turf</span>
            <span className="block">Play Your Game</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-200 mb-4 md:mb-6">
            Book premium sports turfs across the city for Football,
            Cricket, Hockey and more — with just a few clicks.
          </p>

          <NavLink to="/turfs">
            <button className="bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold hover:bg-gray-200 text-sm sm:text-base">
              Explore Turfs
            </button>
          </NavLink>

          {/* ── MOBILE SEARCH BAR ── */}
          <div className="mt-6 block sm:hidden">
            <div className="bg-white rounded-2xl shadow-lg flex items-center px-3 py-3 gap-1">

              {/* Sport */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 pr-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Sport</span>
                <select
                  value={form.sport}
                  onChange={e => set("sport", e.target.value)}
                  className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5"
                >
                  <option value="">All</option>
                  {SPORT_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.value}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 px-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">City</span>
                {loadingCities ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse mt-0.5" />
                ) : (
                  <select
                    value={form.city}
                    onChange={e => set("city", e.target.value)}
                    className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5"
                  >
                    <option value="">All</option>
                    {cities.map(c => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 px-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Date</span>
                <input
                  type="date"
                  value={form.date}
                  min={getTodayStr()}
                  onChange={e => set("date", e.target.value)}
                  className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none cursor-pointer mt-0.5 w-full"
                  style={{ colorScheme: "light" }}
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl p-2.5 ml-1 flex-shrink-0 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>

            </div>
          </div>
        </div>

        {/* ── DESKTOP BOOKING CARD ── */}
        <div className="hidden sm:block dark:bg-[#0d1f3c]/80 bg-white/90 backdrop-blur-md p-4 mt-16 sm:mt-20 rounded-2xl w-[280px] sm:w-[320px] dark:border-[#1a3a5c] border-gray-200 border shadow-lg dark:shadow-none">

          <span className="dark:text-green-400 text-green-600 text-[10px] font-bold tracking-[2px] uppercase">⚽ Quick Book</span>
          <p className="dark:text-slate-300 text-slate-600 text-xs mt-1 mb-3 leading-relaxed">
            Discover and book top quality courts effortlessly with
            <span className="dark:text-green-400 text-green-600 font-semibold"> Turfhub.</span>
          </p>

          <div className="dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-4 space-y-3">

            {/* City — real data from DB */}
            <div>
              <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                Location
              </label>
              {loadingCities ? (
                <div className="h-8 dark:bg-[#1a3a5c] bg-gray-200 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => (
                    <option key={c.city} value={c.city}>
                      {c.city} ({c.count} turf{c.count !== 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sport */}
            <div>
              <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                Sport
              </label>
              <select
                value={form.sport}
                onChange={e => set("sport", e.target.value)}
                className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200"
              >
                <option value="">All Sports</option>
                {SPORT_TYPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={getTodayStr()}
                  onChange={e => set("date", e.target.value)}
                  className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200 dark:[color-scheme:dark] [color-scheme:light]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => set("time", e.target.value)}
                  className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200 dark:[color-scheme:dark] [color-scheme:light]"
                />
              </div>
            </div>

            <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200" />

            <button
              onClick={handleSearch}
              className="w-full bg-green-500 dark:text-[#0a1628] text-white py-2.5 rounded-xl text-xs font-extrabold tracking-wide hover:bg-green-400 active:scale-95 transition-all duration-200"
            >
              Book Court Now →
            </button>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Banner;