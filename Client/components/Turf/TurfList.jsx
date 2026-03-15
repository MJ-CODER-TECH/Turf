import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TurfCard from './TurfCard';
import { FaArrowRightLong } from "react-icons/fa6";
import { NavLink } from 'react-router-dom';

const TurfList = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/turfs`);
        setTurfs(data.data);
      } catch (err) {
        setError('Failed to fetch turfs');
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-20 dark:bg-[#0a1628] bg-gray-50 gap-3">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-green-500 dark:text-green-400 font-semibold animate-pulse">Loading turfs...</p>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center py-20 dark:bg-[#0a1628] bg-gray-50">
      <p className="text-red-500 dark:text-red-400 font-semibold">{error}</p>
    </div>
  );

  if (!turfs.length) return (
    <div className="flex justify-center items-center py-20 dark:bg-[#0a1628] bg-gray-50">
      <p className="dark:text-slate-400 text-slate-500">No turfs found.</p>
    </div>
  );

  return (
    <section className="dark:bg-[#0a1628] bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div className="flex flex-col gap-2">
            <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">
              ⚽ Featured Turfs
            </span>
            <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold leading-tight">
              Available <span className="dark:text-green-400 text-green-600">Turfs</span>
            </h2>
            <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600" />
          </div>

          <NavLink
            to="/turfs"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-green-500 dark:text-green-400 text-green-600 text-sm font-bold hover:bg-green-500 dark:hover:text-[#0a1628] hover:text-white transition-all duration-200 group"
          >
            See All
            <FaArrowRightLong className="group-hover:translate-x-1 transition-transform duration-200" />
          </NavLink>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {turfs.map(turf => (
            <TurfCard key={turf._id} turf={turf} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default TurfList;