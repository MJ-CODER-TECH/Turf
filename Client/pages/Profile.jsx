import { useState, useEffect } from "react";
import axios from "axios";

const SPORTS = ["Football", "Cricket", "Badminton", "Basketball", "Tennis", "Box Cricket", "Other"];
const API = import.meta.env.VITE_API_URL; // ← Navbar jaisa same

export default function ProfilePage() {
  const [dark, setDark] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [sport, setSport] = useState("");
  const [favs, setFavs] = useState([]);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const initials = name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ── Navbar jaisa token fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token"); // ← Navbar jaisa
        if (!token) {
          showToast("Please login first", "error");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }, // ← Navbar jaisa
        });

        const u = res.data.data;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setRole(u.role || "user");
        setSport(u.favouriteSport || "");
        setIsPhoneVerified(u.isPhoneVerified || false);
        setIsEmailVerified(u.isEmailVerified || false);
        setFavs(u.favouriteTurfs || []);
      } catch (err) {
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 2400);
  }

  // ── PUT /users/profile
  async function handleSave() {
    if (name.trim().length < 2) {
      showToast("Name must be at least 2 characters", "error");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/users/profile`,
        { name: name.trim(), favouriteSport: sport || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // localStorage ka user bhi update karo — Navbar refresh ke liye
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: name.trim(), favouriteSport: sport }));
      window.dispatchEvent(new Event("storage")); // ← Navbar ko bhi update karo

      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── POST /users/favourites/:turfId
  async function removeFav(turfId) {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/users/favourites/${turfId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.action === "removed") {
        setFavs((f) => f.filter((t) => t._id !== turfId));
        showToast("Removed from favourites");
      }
    } catch (err) {
      showToast("Could not remove favourite", "error");
    }
  }


  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-[#0a1628]" : "bg-slate-50"}`}>
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#0a1628] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-md mx-auto px-4 py-6 pb-16">

        {/* ── Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold">My Profile</h1>
          <button
            onClick={() => setDark((d) => !d)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
              dark ? "bg-[#1a3a5c] text-slate-400 hover:text-slate-200" : "bg-slate-200 text-slate-500 hover:text-slate-700"
            }`}
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* ── Avatar */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${
            dark ? "bg-[#0a1628] border-[#1a3a5c] text-green-400" : "bg-green-50 border-green-200 text-green-600"
          }`}>
            {initials}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{name || "Your Name"}</p>
            <p className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>{email}</p>
            <span className="mt-1 inline-block text-xs px-3 py-0.5 rounded-full font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
              {role}
            </span>
          </div>
        </div>

        {/* ── Personal Info */}
        <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          ✦ Personal info
        </p>
        <div className={`rounded-2xl border overflow-hidden mb-4 ${
          dark ? "bg-[#0d1f3c] border-[#1a3a5c]" : "bg-white border-slate-200"
        }`}>

          {/* Name — editable */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-[#1a3a5c]" : "border-slate-100"}`}>
            <span className={`text-sm min-w-[90px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Name</span>
            <input
              className={`flex-1 text-sm text-right bg-transparent border-none outline-none ${dark ? "text-slate-100" : "text-slate-900"}`}
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email — read only + verified badge */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-[#1a3a5c]" : "border-slate-100"}`}>
            <span className={`text-sm min-w-[90px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Email</span>
            <div className="flex items-center gap-2">
              {isEmailVerified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                  verified
                </span>
              )}
              <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{email}</span>
            </div>
          </div>

          {/* Phone — read only + verified badge */}
          <div className={`flex items-center justify-between px-4 py-3`}>
            <span className={`text-sm min-w-[90px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Phone</span>
            <div className="flex items-center gap-2">
              {isPhoneVerified ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                  verified
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                  unverified
                </span>
              )}
              <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{phone}</span>
            </div>
          </div>
        </div>

        {/* ── Favourite Sport */}
        <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          ✦ Favourite sport
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
        {SPORTS.map((s) => (
  <button
    key={s}
    onClick={() => setSport(s)}
    className={`py-2 rounded-xl border text-sm font-medium transition-all duration-150 ${
      sport === s
        ? "border-green-500 bg-green-500/10 text-green-500 font-semibold"
        : dark
        ? "border-[#1a3a5c] text-slate-400 hover:border-green-500/40"
        : "border-slate-200 text-slate-500 hover:border-green-400/40"
    }`}
  >
    {s}  {/* ← bas s, no .charAt(0).toUpperCase() needed */}
  </button>
))}

        </div>

        {/* ── Favourite Turfs */}
        <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          ✦ Favourite turfs
        </p>
        <div className="mb-4 flex flex-col gap-2">
          {favs.length === 0 ? (
            <p className={`text-sm text-center py-6 ${dark ? "text-slate-600" : "text-slate-300"}`}>
              No favourite turfs yet
            </p>
          ) : (
            favs.map((t) => (
              <div
                key={t._id}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                  dark ? "bg-[#0a1628] border-[#1a3a5c]" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                    {t.name}
                  </p>
                  {t.location?.city && (
                    <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                      {t.location.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFav(t._id)}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-red-400 text-base hover:bg-red-400/10 transition-all ${
                    dark ? "border-[#1a3a5c]" : "border-red-100"
                  }`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all duration-150 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* ── Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-sm px-5 py-2 rounded-full font-medium shadow-lg ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}