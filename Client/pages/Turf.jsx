import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import TurfCard from "../components/Turf/TurfCard";
import Footer from "../components/Footer/Footer"

const TurfPage = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    location: "",
    sports: [],
    priceRange: { min: "", max: "" },
    rating: "",
    isVerified: false
  });

  // Fetch turfs
  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/v1/turfs");
        const turfArray = response.data.data || [];
        setTurfs(turfArray);
      } catch (err) {
        console.error("Error fetching turfs:", err);
        setError("Unable to load turfs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, []);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const sports = new Set();
    let minPrice = Infinity, maxPrice = 0;

    turfs.forEach(turf => {
      if (turf.sport) sports.add(turf.sport);
      const price = turf.price || turf.pricing?.basePrice;
      if (price) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    return {
      sports: Array.from(sports).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice || 10000
      }
    };
  }, [turfs]);

  // Filter and sort turfs
  const filteredTurfs = useMemo(() => {
    let filtered = [...turfs];

    // Apply filters
    if (filters.location) {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(turf => 
        turf.name?.toLowerCase().includes(searchTerm) ||
        turf.location?.city?.toLowerCase().includes(searchTerm) ||
        turf.location?.area?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.sports.length > 0) {
      filtered = filtered.filter(turf => 
        filters.sports.includes(turf.sport)
      );
    }

    if (filters.priceRange.min) {
      filtered = filtered.filter(turf => 
        (turf.price || turf.pricing?.basePrice) >= Number(filters.priceRange.min)
      );
    }

    if (filters.priceRange.max) {
      filtered = filtered.filter(turf => 
        (turf.price || turf.pricing?.basePrice) <= Number(filters.priceRange.max)
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(turf => 
        (turf.rating?.average || 0) >= Number(filters.rating)
      );
    }

    if (filters.isVerified) {
      filtered = filtered.filter(turf => turf.isVerified === true);
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.price || a.pricing?.basePrice) - (b.price || b.pricing?.basePrice));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || b.pricing?.basePrice) - (a.price || a.pricing?.basePrice));
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        break;
      default: // recommended
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return filtered;
  }, [turfs, filters, sortBy]);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSportToggle = (sport) => {
    setFilters(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      sports: [],
      priceRange: { min: "", max: "" },
      rating: "",
      isVerified: false
    });
    setSortBy("recommended");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.sports.length) count++;
    if (filters.priceRange.min || filters.priceRange.max) count++;
    if (filters.rating) count++;
    if (filters.isVerified) count++;
    return count;
  }, [filters]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading turfs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find Turfs</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredTurfs.length} turf{filteredTurfs.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`
            lg:w-64 lg:block
            ${showFilters ? 'block' : 'hidden'}
          `}>
            <div className="bg-white rounded-xl shadow-sm p-5">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search Location */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search by city or area"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sports Filter */}
              {filterOptions.sports.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sports
                  </label>
                  <div className="space-y-2">
                    {filterOptions.sports.map((sport) => (
                      <label key={sport} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.sports.includes(sport)}
                          onChange={() => handleSportToggle(sport)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Min ${formatPrice(filterOptions.priceRange.min)}`}
                    value={filters.priceRange.min}
                    onChange={(e) => handleFilterChange('priceRange', { 
                      ...filters.priceRange, 
                      min: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder={`Max ${formatPrice(filterOptions.priceRange.max)}`}
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange('priceRange', { 
                      ...filters.priceRange, 
                      max: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any rating</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                  <option value="2">2+ stars</option>
                </select>
              </div>

              {/* Verified Filter */}
              <div className="mb-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Verified only</span>
                  <input
                    type="checkbox"
                    checked={filters.isVerified}
                    onChange={(e) => handleFilterChange('isVerified', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Turf Grid */}
          <div className="flex-1">
            {filteredTurfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTurfs.map((turf) => (
                  <TurfCard key={turf._id} turf={turf} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-600 mb-3">No turfs match your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default TurfPage;