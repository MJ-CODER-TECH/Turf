import React from 'react';
import { Link } from 'react-router-dom';

const TurfCard = ({ turf }) => {
  return (
    <Link to={`/turf/${turf._id}`} className="block group">
      <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl overflow-hidden transition-all duration-300 group-hover:border-green-500 dark:group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group-hover:scale-[1.02]">

        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={turf.images?.[0]?.url || '/default-turf.jpg'}
            alt={turf.images?.[0]?.alt || turf.name}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t dark:from-[#0d1f3c] from-white/60 via-transparent to-transparent" />

          {/* Badge */}
          {turf.badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold bg-green-500 text-white dark:text-[#0a1628] rounded-md uppercase tracking-wide">
              {turf.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold dark:text-white text-gray-900 text-lg leading-tight mb-1 dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">
            {turf.name}
          </h3>
          <p className="text-sm dark:text-slate-400 text-slate-500 flex items-center gap-1">
            {turf.location?.city}, {turf.location?.area}
          </p>

          {/* Divider */}
          <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 my-3" />

          {/* Price & Rating */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs dark:text-slate-400 text-slate-500">Per Hour</span>
              <p className="dark:text-green-400 text-green-600 font-extrabold text-lg leading-tight">
                ₹{turf.price}
              </p>
            </div>
            <div className="flex items-center gap-1.5 dark:bg-[#0a1628] bg-gray-50 px-3 py-1.5 rounded-lg dark:border-[#1a3a5c] border-gray-200 border">
              <span className="text-yellow-400 text-sm">⭐</span>
              <span className="dark:text-white text-gray-800 font-semibold text-sm">
                {turf.rating?.average?.toFixed(1) || '0.0'}
              </span>
              <span className="dark:text-slate-500 text-slate-400 text-xs">
                ({turf.rating?.count || 0})
              </span>
            </div>
          </div>

          {/* Book Button */}
          <button className="w-full mt-4 py-2 rounded-lg bg-green-500 dark:text-[#0a1628] text-white font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-400">
            Book Now →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default TurfCard;