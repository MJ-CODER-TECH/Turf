import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import TurfCard from "../components/Turf/TurfCard";
import Footer from "../components/Footer/Footer";
import { FaFilter, FaTimes } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const TurfPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [turfs, setTurfs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ URL params se initial filters lo (Banner se navigate karne pe auto-apply)
  const [filters, setFilters] = useState({
    location:   searchParams.get("city")     || "",
    sport:      searchParams.get("sport")    || "",
    date:       searchParams.get("date")     || "",
    priceRange: { min: "", max: "" },
    rating:     "",
    isVerified: false,
  });

  const [sortBy, setSortBy] = useState("recommended");

  // ✅ URL params change hone pe (Banner se aane pe) filters update karo
  useEffect(() => {
    const city  = searchParams.get("city")  || "";
    const sport = searchParams.get("sport") || "";
    const date  = searchParams.get("date")  || "";

    setFilters(prev => ({
      ...prev,
      location: city,
      sport,
      date,
    }));
  }, [searchParams]);

  // ✅ API se turfs fetch karo — filters ke saath
  const fetchTurfs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.location)       params.city     = filters.location;
      if (filters.sport)          params.sport    = filters.sport;
      if (filters.priceRange.min) params.minPrice = filters.priceRange.min;
      if (filters.priceRange.max) params.maxPrice = filters.priceRange.max;
      if (filters.rating)         params.rating   = filters.rating;

      const { data } = await axios.get(`${API_BASE_URL}/turfs`, { params });
      setTurfs(data.data || []);
    } catch {
      setError("Unable to load turfs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.sport, filters.priceRange, filters.rating]);

  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  // Client-side sort + verified filter (API pe sort bhi support karta hai lekin yahan fast hai)
  const filteredTurfs = useMemo(() => {
    let list = [...turfs];

    if (filters.isVerified) list = list.filter(t => t.isVerified === true);

    switch (sortBy) {
      case "price-low":  list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price-high": list.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "rating":     list.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)); break;
      default:           list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [turfs, filters.isVerified, sortBy]);

  // Sports list from fetched turfs
  const sportOptions = useMemo(() => {
    const s = new Set(turfs.map(t => t.sport).filter(Boolean));
    return Array.from(s).sort();
  }, [turfs]);

  const handleFilterChange = (type, value) =>
    setFilters(prev => ({ ...prev, [type]: value }));

  const clearFilters = () => {
    setFilters({ location: "", sport: "", date: "", priceRange: { min: "", max: "" }, rating: "", isVerified: false });
    setSortBy("recommended");
    setSearchParams({});   // URL bhi clear karo
  };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.location) c++;
    if (filters.sport) c++;
    if (filters.date) c++;
    if (filters.priceRange.min || filters.priceRange.max) c++;
    if (filters.rating) c++;
    if (filters.isVerified) c++;
    return c;
  }, [filters]);

  const inputCls = "w-full px-3 py-2 dark:bg-[#0a1628] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-lg text-sm dark:text-white text-gray-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors duration-200";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 dark:text-green-400 text-green-600 font-semibold animate-pulse">Loading turfs...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchTurfs} className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
          <div className="flex flex-col gap-2">
            <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">⚽ Explore</span>
            <h1 className="dark:text-white text-gray-900 text-3xl font-extrabold leading-tight">
              Find <span className="dark:text-green-400 text-green-600">Turfs</span>
            </h1>
            <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
            <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
              {filteredTurfs.length} turf{filteredTurfs.length !== 1 ? "s" : ""} available
              {/* ✅ Active filters dikhao */}
              {(filters.sport || filters.location) && (
                <span className="ml-2 dark:text-green-400 text-green-600 font-semibold">
                  {[filters.sport, filters.location].filter(Boolean).join(" · ")}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border dark:text-white text-gray-800 rounded-lg text-sm focus:outline-none focus:border-green-500 transition-colors duration-200"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border hover:border-green-500 dark:text-white text-gray-800 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <FaFilter className="text-green-500 dark:text-green-400 w-3 h-3" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-green-500 dark:text-[#0a1628] text-white text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className={`lg:w-64 lg:block ${showFilters ? "block" : "hidden"}`}>
            <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-5 shadow-sm">

              <div className="flex items-center justify-between mb-5">
                <h2 className="dark:text-white text-gray-900 font-bold text-base flex items-center gap-2">
                  <FaFilter className="text-green-500 dark:text-green-400 w-3 h-3" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs dark:text-green-400 text-green-600 hover:text-green-500 font-semibold transition-colors">
                    <FaTimes className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div className="w-full h-px dark:bg-[#1a3a5c] bg-gray-200 mb-5" />

              {/* Location */}
              <div className="mb-5">
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search city or area..."
                  value={filters.location}
                  onChange={e => handleFilterChange("location", e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Sport */}
              {sportOptions.length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-3">
                    Sport
                  </label>
                  <div className="space-y-2">
                    {sportOptions.map(sport => (
                      <label key={sport} className="flex items-center gap-2 cursor-pointer group">
                        <div
                          onClick={() => handleFilterChange("sport", filters.sport === sport ? "" : sport)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 ${
                            filters.sport === sport
                              ? "bg-green-500 border-green-500"
                              : "dark:border-[#1a3a5c] border-gray-300 group-hover:border-green-500"
                          }`}
                        >
                          {filters.sport === sport && (
                            <span className="dark:text-[#0a1628] text-white text-xs font-black">✓</span>
                          )}
                        </div>
                        <span
                          onClick={() => handleFilterChange("sport", filters.sport === sport ? "" : sport)}
                          className="text-sm dark:text-slate-300 text-slate-600 cursor-pointer dark:group-hover:text-white group-hover:text-gray-900 transition-colors"
                        >
                          {sport}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-5">
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                  Price Range (₹/hr)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange.min}
                    onChange={e => handleFilterChange("priceRange", { ...filters.priceRange, min: e.target.value })}
                    className={inputCls}
                  />
                  <span className="dark:text-slate-500 text-slate-400 font-bold">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange.max}
                    onChange={e => handleFilterChange("priceRange", { ...filters.priceRange, max: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-5">
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={e => handleFilterChange("rating", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Any rating</option>
                  <option value="4">⭐ 4+ stars</option>
                  <option value="3">⭐ 3+ stars</option>
                  <option value="2">⭐ 2+ stars</option>
                </select>
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-slate-300 text-slate-600">Verified only</span>
                <div
                  onClick={() => handleFilterChange("isVerified", !filters.isVerified)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all duration-300 relative ${
                    filters.isVerified ? "bg-green-500" : "dark:bg-[#1a3a5c] bg-gray-200"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    filters.isVerified ? "left-6" : "left-1"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Turf Grid */}
          <div className="flex-1">
            {filteredTurfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTurfs.map(turf => (
                  <TurfCard key={turf._id} turf={turf} />
                ))}
              </div>
            ) : (
              <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-12 text-center shadow-sm">
                <p className="text-4xl mb-4">🏟️</p>
                <p className="dark:text-white text-gray-900 font-bold text-lg mb-1">No turfs found</p>
                <p className="dark:text-slate-400 text-slate-500 text-sm mb-5">
                  Try adjusting your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TurfPage;