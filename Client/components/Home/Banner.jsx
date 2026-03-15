import React from "react";
import { NavLink } from "react-router-dom";

const Banner = () => {
  return (
    <section className="relative w-full h-screen">

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="turf"
        className="absolute w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25"></div>

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

        <NavLink to="/turfs" >
            <button className="bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold hover:bg-gray-200 text-sm sm:text-base">
            Explore Turfs
          </button></NavLink>

          {/* ── MOBILE HORIZONTAL SEARCH BAR ── */}
          <div className="mt-20 block sm:hidden">
            <div className="bg-white rounded-2xl shadow-lg flex items-center px-3 py-3 gap-1">

              {/* Court Type */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 pr-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Type</span>
                <select className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5">
                  <option>Football</option>
                  <option>Cricket</option>
                  <option>Hockey</option>
                  <option>Tennis</option>
                </select>
              </div>

              {/* Location */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 px-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Location</span>
                <select className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5">
                  <option>Gulsan</option>
                  <option>Pune</option>
                  <option>Mumbai</option>
                  <option>Delhi</option>
                  <option>Bangalore</option>
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 px-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Date</span>
                <input
                  type="date"
                  className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none cursor-pointer mt-0.5 w-full"
                  style={{ colorScheme: "light" }}
                />
              </div>

              {/* Price */}
              <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 px-2">
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">Price</span>
                <select className="text-gray-800 text-xs font-medium bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5">
                  <option>2000 TK</option>
                  <option>1000 TK</option>
                  <option>1500 TK</option>
                  <option>3000 TK</option>
                </select>
              </div>

              {/* Search Button */}
              <button className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-2.5 ml-1 flex-shrink-0 transition-colors">
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

    {/* Location */}
    <div>
      <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Location</label>
      <select className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200">
        <option>Select your perfect location</option>
        <option>Pune</option>
        <option>Mumbai</option>
        <option>Delhi</option>
        <option>Bangalore</option>
      </select>
    </div>

    {/* Court Type */}
    <div>
      <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Court Type</label>
      <select className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200">
        <option>Court type (e.g clay, grass)</option>
        <option>Football</option>
        <option>Cricket</option>
        <option>Hockey</option>
        <option>Tennis</option>
      </select>
    </div>

    {/* Duration */}
    <div>
      <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Duration</label>
      <select className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200">
        <option>Select Duration</option>
        <option>1 Hour</option>
        <option>2 Hours</option>
        <option>3 Hours</option>
      </select>
    </div>

    {/* Date & Time */}
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Date</label>
        <input
          type="date"
          className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200 dark:[color-scheme:dark] [color-scheme:light]"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider block mb-1">Time</label>
        <input
          type="time"
          className="w-full dark:border-[#1a3a5c] border-gray-200 border rounded-lg p-2 text-xs dark:bg-[#0d1f3c] bg-white dark:text-white text-gray-800 focus:outline-none focus:border-green-500 transition-colors duration-200 dark:[color-scheme:dark] [color-scheme:light]"
        />
      </div>
    </div>

    {/* Divider */}
    <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200" />

    {/* Button */}
    <button className="w-full bg-green-500 dark:text-[#0a1628] text-white py-2.5 rounded-xl text-xs font-extrabold tracking-wide hover:bg-green-400 transition-colors duration-200">
      Book Court Now →
    </button>

  </div>
</div>

      </div>
    </section>
  );
};

export default Banner;