import React from 'react';
import { Link } from 'react-router-dom';

const TurfCard = ({ turf }) => {
  return (
      <Link to={`/turf/${turf._id}`}>

    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-xl transition duration-300">
      {/* Primary image */}
      <img
        src={turf.images?.[0]?.url || '/default-turf.jpg'}
        alt={turf.images?.[0]?.alt || turf.name}
        className="w-full h-48 object-cover"
      />

      {/* Turf info */}
      <div className="p-4">
        <h3 className="font-bold text-lg">{turf.name}</h3>
        <p className="text-sm text-gray-500">
          {turf.location?.city}, {turf.location?.area}
        </p>

        {/* Price & Rating */}
        <div className="flex justify-between mt-2 items-center">
          <span className="text-blue-600 font-bold">₹{turf.price}</span>
          <span className="text-yellow-500 font-semibold">
            ⭐ {turf.rating?.average?.toFixed(1) || 0} ({turf.rating?.count || 0})
          </span>
        </div>

        {/* Badge */}
        {turf.badge && (
          <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
            {turf.badge}
          </span>
        )}
      </div>
    </div>
      </Link>

  );
};

export default TurfCard;