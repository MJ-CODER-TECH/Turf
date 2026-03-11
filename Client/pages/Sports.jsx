import React from "react";

const SportPage = () => {
  const sports = [
    {
      id: 1,
      icon: "⚽",
      name: "Football",
      turfs: "38 turfs across all cities",
      venues: ["Green Arena", "Night Blaze FC", "Goal Rush"],
      link: "→",
    },
    {
      id: 2,
      icon: "🏏",
      name: "Cricket",
      turfs: "24 turfs across all cities",
      venues: ["Power Pitch", "Box Cricket Hub"],
      link: "→",
    },
    {
      id: 3,
      icon: "🏸",
      name: "Badminton",
      turfs: "19 turfs across all cities",
      venues: ["Smash Hub"],
      link: "→",
    },
    {
      id: 4,
      icon: "🏀",
      name: "Basketball",
      turfs: "12 turfs across all cities",
      venues: ["Slam Dunk Arena"],
      link: "→",
    },
    {
      id: 5,
      icon: "🎾",
      name: "Tennis",
      turfs: "8 turfs across all cities",
      venues: ["SpeedCourt"],
      link: "→",
    },
    {
      id: 6,
      icon: "🏏",
      name: "Box Cricket",
      turfs: "15 turfs across all cities",
      venues: [],
      link: "→",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 py-8 bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
        <p className="text-lg text-gray-600">SPORTS</p>
        <p className="text-sm text-gray-500 mt-1">
          From football to badminton — every sport covered
        </p>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Categories</h2>
        <p className="text-sm text-gray-500 mb-6">ALL SPORTS</p>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{sport.icon}</span>
              <span className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer">
                {sport.link}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {sport.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{sport.turfs}</p>
            <div className="space-y-2">
              {sport.venues.map((venue, index) => (
                <p key={index} className="text-gray-800 font-medium">
                  {venue}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Subtle footer note to maintain theme consistency */}
      <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-4 text-center">
        <span>every sport — every turf</span>
      </div>
    </div>
  );
};

export default SportPage;