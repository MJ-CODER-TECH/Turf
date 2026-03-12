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
        setTurfs(data.data); // tumhare response me data field me array hai
      } catch (err) {
        setError('Failed to fetch turfs');
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  if (loading) return <p className="text-center py-10">Loading turfs...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!turfs.length) return <p className="text-center py-10">No turfs found.</p>;

  return (
    <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between ">      <h2 className="text-2xl font-bold mb-4">Available Turfs</h2>
          <NavLink to="/turfs" className="flex items-center  hover:underline">
          <h2 className="text-sm flex items-center gap-2 mr-3 font-bold mb-4">See More   <FaArrowRightLong className="bounce-right" /></h2></NavLink>
</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {turfs.map(turf => (
          <TurfCard key={turf._id} turf={turf} />
        ))}
      </div>
    </div>
  );
};

export default TurfList;