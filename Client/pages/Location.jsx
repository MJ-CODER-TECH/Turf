import React from 'react';
import Footer from "../components/Footer/Footer"
const LocationsPage = () => {
  const cities = [
    { name: 'MUMBAI', displayName: 'Mumbai', count: 45, status: 'Most Popular' },
    { name: 'THANE', displayName: 'Thane', count: 18, status: 'Most Popular' },
    { name: 'PUNE', displayName: 'Pune', count: 32, status: 'Trending' },
    { name: 'NAVI MUMBAI', displayName: 'Navi Mumbai', count: 22, status: 'Trending' },
    { name: 'NASHIK', displayName: 'Nashik', count: 12, status: 'New' },
    { name: 'NAGPUR', displayName: 'Nagpur', count: 15, status: 'New' }
  ];

  return (
    <div className="min-h-screen mt-15 bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase mb-2">Explore</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">LOCATIONS</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find premium turfs near you across Maharashtra
            </p>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="map">🗺️</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">INTERACTIVE MAP</h2>
                <p className="text-sm text-gray-500">Connect Google Maps API for live turf locations</p>
              </div>
            </div>
          </div>
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">🗺️</div>
              <p className="text-gray-500">Map integration placeholder</p>
              <p className="text-xs text-gray-400 mt-1">Google Maps API ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">ALL CITIES</h2>
          <span className="text-sm text-gray-500">{cities.length} locations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <div
              key={city.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{city.name}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{city.displayName}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    city.status === 'Most Popular' ? 'bg-blue-100 text-blue-800' :
                    city.status === 'Trending' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {city.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Turfs available</span>
                  <span className="text-2xl font-bold text-gray-900">{city.count}</span>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  View turfs in {city.displayName} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            🏟️ Premium turfs across Maharashtra • Book your game now
          </p>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default LocationsPage;