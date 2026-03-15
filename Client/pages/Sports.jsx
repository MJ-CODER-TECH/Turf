import React from "react";

const SportPage = () => {
  const sports = [
    { id: 1, icon: "⚽", name: "Football", turfs: "38 turfs across all cities", venues: ["Green Arena", "Night Blaze FC", "Goal Rush"] },
    { id: 2, icon: "🏏", name: "Cricket", turfs: "24 turfs across all cities", venues: ["Power Pitch", "Box Cricket Hub"] },
    { id: 3, icon: "🏸", name: "Badminton", turfs: "19 turfs across all cities", venues: ["Smash Hub"] },
    { id: 4, icon: "🏀", name: "Basketball", turfs: "12 turfs across all cities", venues: ["Slam Dunk Arena"] },
    { id: 5, icon: "🎾", name: "Tennis", turfs: "8 turfs across all cities", venues: ["SpeedCourt"] },
    { id: 6, icon: "🏏", name: "Box Cricket", turfs: "15 turfs across all cities", venues: [] },
  ];

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="mb-12">
          <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">🏅 Categories</span>
          <h1 className="dark:text-white text-gray-900 text-4xl font-extrabold mt-2 mb-3">
            All <span className="dark:text-green-400 text-green-600">Sports</span>
          </h1>
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-3" />
          <p className="dark:text-slate-400 text-slate-500 text-sm">From football to badminton — every sport covered</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300 cursor-pointer"
            >
              {/* Icon & Arrow */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl flex items-center justify-center text-3xl group-hover:border-green-500 transition-colors duration-300">
                  {sport.icon}
                </div>
                <span className="dark:text-slate-500 text-slate-400 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors duration-200 text-lg font-bold">→</span>
              </div>

              <div className="w-8 h-0.5 bg-green-500 rounded-full mb-3" />

              <h3 className="dark:text-white text-gray-900 text-xl font-extrabold mb-1 dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">
                {sport.name}
              </h3>
              <p className="dark:text-slate-400 text-slate-500 text-sm mb-4">{sport.turfs}</p>

              {/* Venues */}
              {sport.venues.length > 0 && (
                <div className="space-y-1.5">
                  {sport.venues.map((venue, index) => (
                    <p key={index} className="dark:text-slate-300 text-slate-600 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {venue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-xs dark:text-slate-600 text-slate-400 dark:border-[#1a3a5c] border-gray-200 border-t pt-4 text-center">
          every sport — every turf
        </div>
      </div>
    </div>
  );
};

export default SportPage;