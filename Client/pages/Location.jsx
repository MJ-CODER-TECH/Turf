import React from 'react';
import Footer from "../components/Footer/Footer";

const LocationsPage = () => {
  const cities = [
    { name: 'MUMBAI', displayName: 'Mumbai', count: 45, status: 'Most Popular' },
    { name: 'THANE', displayName: 'Thane', count: 18, status: 'Most Popular' },
    { name: 'PUNE', displayName: 'Pune', count: 32, status: 'Trending' },
    { name: 'NAVI MUMBAI', displayName: 'Navi Mumbai', count: 22, status: 'Trending' },
    { name: 'NASHIK', displayName: 'Nashik', count: 12, status: 'New' },
    { name: 'NAGPUR', displayName: 'Nagpur', count: 15, status: 'New' },
  ];

  const statusStyle = {
    'Most Popular': 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
    'Trending': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    'New': 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30',
  };

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 py-15">

      {/* Map Placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 dark:border-[#1a3a5c] border-gray-200 border-b flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="dark:text-white text-gray-900 font-bold">Interactive Map</h2>
              <p className="dark:text-slate-400 text-slate-500 text-sm">Connect Google Maps API for live turf locations</p>
            </div>
          </div>
          <div className="h-56 dark:bg-[#0a1628] bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="dark:text-slate-400 text-slate-500 text-sm">Map integration placeholder</p>
              <p className="dark:text-slate-500 text-slate-400 text-xs mt-1">Google Maps API ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-8">
          <div className="flex flex-col gap-2">
            <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">🏙️ Cities</span>
            <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold">All <span className="dark:text-green-400 text-green-600">Cities</span></h2>
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
          </div>
          <span className="dark:text-slate-400 text-slate-500 text-sm">{cities.length} locations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <div
              key={city.name}
              className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl overflow-hidden hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="dark:text-slate-500 text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">{city.name}</p>
                    <h3 className="dark:text-white text-gray-900 text-2xl font-extrabold dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">
                      {city.displayName}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle[city.status]}`}>
                    {city.status}
                  </span>
                </div>

                <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 my-4" />

                <div className="flex items-center justify-between">
                  <span className="dark:text-slate-400 text-slate-500 text-sm">Turfs available</span>
                  <span className="dark:text-green-400 text-green-600 text-2xl font-extrabold">{city.count}</span>
                </div>
              </div>

              <div className="px-6 py-3 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border-t dark:group-hover:border-green-500/30 group-hover:border-green-500/30 transition-colors duration-300">
                <button className="text-sm font-semibold dark:text-slate-400 text-slate-500 dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">
                  View turfs in {city.displayName} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      {/* <div className="dark:border-[#1a3a5c] border-gray-200 border-t dark:bg-[#0d1f3c] bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 text-center">
          <p className="dark:text-slate-400 text-slate-500 text-sm">🏟️ Premium turfs across Maharashtra • Book your game now</p>
        </div>
      </div> */}
      
      <Footer />
    </div>
  );
};

export default LocationsPage;