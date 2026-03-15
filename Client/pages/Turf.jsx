import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import TurfCard from "../components/Turf/TurfCard";
import Footer from "../components/Footer/Footer";
import { FaFilter, FaTimes } from "react-icons/fa";

const TurfPage = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: "",
    sports: [],
    priceRange: { min: "", max: "" },
    rating: "",
    isVerified: false,
  });

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/turfs`);
        setTurfs(response.data.data || []);
      } catch (err) {
        setError("Unable to load turfs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  const filterOptions = useMemo(() => {
    const sports = new Set();
    let minPrice = Infinity, maxPrice = 0;
    turfs.forEach((turf) => {
      if (turf.sport) sports.add(turf.sport);
      const price = turf.price || turf.pricing?.basePrice;
      if (price) { minPrice = Math.min(minPrice, price); maxPrice = Math.max(maxPrice, price); }
    });
    return { sports: Array.from(sports).sort(), priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice || 10000 } };
  }, [turfs]);

  const filteredTurfs = useMemo(() => {
    let filtered = [...turfs];
    if (filters.location) {
      const s = filters.location.toLowerCase();
      filtered = filtered.filter(t => t.name?.toLowerCase().includes(s) || t.location?.city?.toLowerCase().includes(s) || t.location?.area?.toLowerCase().includes(s));
    }
    if (filters.sports.length > 0) filtered = filtered.filter(t => filters.sports.includes(t.sport));
    if (filters.priceRange.min) filtered = filtered.filter(t => (t.price || t.pricing?.basePrice) >= Number(filters.priceRange.min));
    if (filters.priceRange.max) filtered = filtered.filter(t => (t.price || t.pricing?.basePrice) <= Number(filters.priceRange.max));
    if (filters.rating) filtered = filtered.filter(t => (t.rating?.average || 0) >= Number(filters.rating));
    if (filters.isVerified) filtered = filtered.filter(t => t.isVerified === true);
    switch (sortBy) {
      case "price-low": filtered.sort((a, b) => (a.price || a.pricing?.basePrice) - (b.price || b.pricing?.basePrice)); break;
      case "price-high": filtered.sort((a, b) => (b.price || b.pricing?.basePrice) - (a.price || a.pricing?.basePrice)); break;
      case "rating": filtered.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)); break;
      default: filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return filtered;
  }, [turfs, filters, sortBy]);

  const handleFilterChange = (type, value) => setFilters(prev => ({ ...prev, [type]: value }));
  const handleSportToggle = (sport) => setFilters(prev => ({ ...prev, sports: prev.sports.includes(sport) ? prev.sports.filter(s => s !== sport) : [...prev.sports, sport] }));
  const clearFilters = () => { setFilters({ location: "", sports: [], priceRange: { min: "", max: "" }, rating: "", isVerified: false }); setSortBy("recommended"); };
  const activeFilterCount = useMemo(() => { let c = 0; if (filters.location) c++; if (filters.sports.length) c++; if (filters.priceRange.min || filters.priceRange.max) c++; if (filters.rating) c++; if (filters.isVerified) c++; return c; }, [filters]);

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
        <button onClick={() => window.location.reload()} className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors">Try Again</button>
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
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Location</label>
                <input type="text" placeholder="Search city or area..." value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)} className={inputCls} />
              </div>

              {/* Sports */}
              {filterOptions.sports.length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-3">Sports</label>
                  <div className="space-y-2">
                    {filterOptions.sports.map((sport) => (
                      <label key={sport} className="flex items-center gap-2 cursor-pointer group">
                        <div
                          onClick={() => handleSportToggle(sport)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer ${filters.sports.includes(sport) ? "bg-green-500 border-green-500" : "dark:border-[#1a3a5c] border-gray-300 group-hover:border-green-500"}`}
                        >
                          {filters.sports.includes(sport) && <span className="dark:text-[#0a1628] text-white text-xs font-black">✓</span>}
                        </div>
                        <span onClick={() => handleSportToggle(sport)} className="text-sm dark:text-slate-300 text-slate-600 cursor-pointer dark:group-hover:text-white group-hover:text-gray-900 transition-colors">
                          {sport}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-5">
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={filters.priceRange.min} onChange={(e) => handleFilterChange("priceRange", { ...filters.priceRange, min: e.target.value })} className={inputCls} />
                  <span className="dark:text-slate-500 text-slate-400 font-bold">—</span>
                  <input type="number" placeholder="Max" value={filters.priceRange.max} onChange={(e) => handleFilterChange("priceRange", { ...filters.priceRange, max: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-5">
                <label className="block text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Minimum Rating</label>
                <select value={filters.rating} onChange={(e) => handleFilterChange("rating", e.target.value)} className={inputCls}>
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
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all duration-300 relative ${filters.isVerified ? "bg-green-500" : "dark:bg-[#1a3a5c] bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${filters.isVerified ? "left-6" : "left-1"}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Turf Grid */}
          <div className="flex-1">
            {filteredTurfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTurfs.map((turf) => <TurfCard key={turf._id} turf={turf} />)}
              </div>
            ) : (
              <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-12 text-center shadow-sm">
                <p className="text-4xl mb-4">🏟️</p>
                <p className="dark:text-white text-gray-900 font-bold text-lg mb-1">No turfs found</p>
                <p className="dark:text-slate-400 text-slate-500 text-sm mb-5">Try adjusting your filters</p>
                <button onClick={clearFilters} className="px-5 py-2 bg-green-500 dark:text-[#0a1628] text-white font-bold rounded-lg hover:bg-green-400 transition-colors text-sm">Clear Filters</button>
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