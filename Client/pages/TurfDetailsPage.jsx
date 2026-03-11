import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';


// Safely get API URL - works in all environments
const getApiBaseUrl = () => {
  // Check for Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }
  
  // Check for Create React App environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }
  
  // Default fallback
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const TurfDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoized values
  const mainImage = useMemo(() => 
    selectedImage || turf?.images?.[0]?.url || '/placeholder-turf.jpg', 
    [selectedImage, turf]
  );

  // Fetch turf details
  const fetchTurf = useCallback(async () => {
    if (!id) {
      setError('Invalid turf ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching from:', `${API_BASE_URL}/turfs/${id}`); // Debug log
      
      const { data } = await axios.get(`${API_BASE_URL}/turfs/${id}`, {
        timeout: 10000, // 10 second timeout
      });

      if (!data?.data) {
        throw new Error('Invalid response structure');
      }

      setTurf(data.data);
      setSelectedImage(data.data.images?.[0]?.url || null);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err.code === 'ECONNABORTED' 
        ? 'Request timeout. Please check your connection.'
        : err.response?.status === 404
        ? 'Turf not found.'
        : err.response?.data?.message || 'Failed to load turf details. Please try again.';
      
      setError(errorMessage);
      console.error('Error fetching turf:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchTurf();
  }, [fetchTurf]);

  // Handle book now
  const handleBookNow = useCallback(() => {
    navigate(`/booking/${id}`, { state: { turf } });
  }, [navigate, id, turf]);

  // Handle go back
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    fetchTurf();
  }, [fetchTurf]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 mt-20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-[400px] bg-gray-200 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 mt-20">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-center text-gray-800">Oops! Something went wrong</h3>
            <p className="mb-6 text-center text-gray-600">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleRetry}
                disabled={retryCount >= 3}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!turf) {
    return (
      <div className="container mx-auto px-4 py-6 mt-20">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Turf Not Found</h3>
            <p className="mb-6 text-gray-600">The turf you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { location, pricing, rating, amenities, rules, cancellationPolicy } = turf;

  return (
    <div className="container mx-auto px-4 py-6 mt-20">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button onClick={() => navigate('/')} className="hover:text-gray-700">Home</button>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li>
            <button onClick={() => navigate('/turfs')} className="hover:text-gray-700">Turfs</button>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-700 font-medium truncate max-w-xs">{turf.name}</li>
        </ol>
      </nav>

      {/* Header Section */}
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{turf.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{location?.city}, {location?.area}</span>
          </span>
          
          {rating?.average > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span>{rating.average.toFixed(1)}</span>
              <span className="text-gray-400">({rating.count} {rating.count === 1 ? 'review' : 'reviews'})</span>
            </span>
          )}
        </div>
      </header>

      {/* Image Gallery */}
      {turf.images?.length > 0 ? (
        <div className="mb-8">
          <div className="mb-4">
            <img
              src={mainImage}
              alt={turf.name}
              className="w-full h-[400px] object-cover rounded-xl shadow-lg"
              onError={(e) => {
                e.target.src = '/placeholder-turf.jpg';
              }}
            />
          </div>
          
          {turf.images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {turf.images.map((img, index) => (
                <button
                  key={img.public_id || index}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative rounded-lg overflow-hidden transition-all ${
                    selectedImage === img.url 
                      ? 'ring-2 ring-blue-500 scale-105' 
                      : 'hover:opacity-75'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${turf.name} - Image ${index + 1}`}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 bg-gray-100 rounded-xl h-[400px] flex items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">About this Turf</h2>
            <p className="text-gray-700 leading-relaxed">{turf.description}</p>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Sport</p>
              <p className="font-semibold">{turf.sport}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="font-semibold capitalize">{turf.type}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Capacity</p>
              <p className="font-semibold">{turf.capacity} players</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Base Price</p>
              <p className="font-semibold text-green-600">₹{turf.price}/hr</p>
            </div>
          </section>

          {amenities?.length > 0 && (
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rules?.length > 0 && (
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">House Rules</h2>
              <ul className="space-y-2">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

     <section className="mb-8">
  <h2 className="text-xl font-semibold mb-3">Location</h2>

  {/* Dummy Google Map */}
  <div className="relative w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
    {/* Marker Icon */}
    <div className="absolute">
      <svg
        className="w-8 h-8 text-red-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
      </svg>
    </div>

    {/* Placeholder text */}
    <p className="text-gray-500 font-semibold">Google Map Placeholder</p>
  </div>
</section>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <h2 className="text-2xl font-bold mb-4">Pricing Details</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Weekday</span>
                <span className="font-semibold">₹{pricing?.weekday}/hr</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Weekend</span>
                <span className="font-semibold">₹{pricing?.weekend}/hr</span>
              </div>
              {pricing?.holiday && (
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Holiday</span>
                  <span className="font-semibold">₹{pricing.holiday}/hr</span>
                </div>
              )}
              {pricing?.peak?.enabled && (
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Peak Hours</span>
                  <span className="font-semibold text-green-600">₹{pricing.peak.price}/hr</span>
                </div>
              )}
            </div>

            {cancellationPolicy && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Cancellation Policy</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Free cancellation up to {cancellationPolicy.freeUntilHours} hours before booking
                </p>
                <p className="text-sm text-gray-600">
                  Refund: {cancellationPolicy.refundPercent}%
                </p>
              </div>
            )}

            <button
              onClick={handleBookNow}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Check Availability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetailsPage;