import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, UserPlus, ChevronDown, LogOut, CalendarDays, Wallet } from "lucide-react";
import ThemeToggle from "../ToogleBTN/ThemeToggle";
import axios from "axios";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (_) {}
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/turfs", label: "Turfs" },
    { path: "/locations", label: "Locations" },
    { path: "/sports", label: "Sports" },
    { path: "/about", label: "About" },
  ];

  // ─── Drawer JSX (NOT a component — inline so DOM node never unmounts) ──────
  const drawerPortal = createPortal(
    <>
      {/* Backdrop */}
      <div
  onClick={() => setIsOpen(false)}
  style={{
    zIndex: 9998,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
  }}
  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
/>

      {/* Drawer Panel */}
     <div
  style={{
    zIndex: 9999,
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
  }}
  className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-900 flex flex-col shadow-2xl"
>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TZ</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              TURFZONE
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* User Info Card */}
          {user && (
            <div className="flex items-center space-x-3 px-3 py-3 bg-green-500/10 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
              Menu
            </p>
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-600 dark:text-green-400 border-l-4 border-green-500"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Account Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
              Account
            </p>
            <div className="flex flex-col space-y-1">
              {user ? (
                <>
                  <NavLink to="/profile" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors">
                      <User className="w-4 h-4" /><span>Profile</span>
                    </button>
                  </NavLink>
                  <NavLink to="/my-bookings" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors">
                      <CalendarDays className="w-4 h-4" /><span>My Bookings</span>
                    </button>
                  </NavLink>
                  <NavLink to="/wallet" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors">
                      <Wallet className="w-4 h-4" /><span>Wallet</span>
                    </button>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                      <LogIn className="w-4 h-4" /><span>Login</span>
                    </button>
                  </NavLink>
                  <NavLink to="/register" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all mt-1">
                      <UserPlus className="w-4 h-4" /><span>Sign Up</span>
                    </button>
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Footer — Logout */}
        {user && (
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" /><span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg py-2"
            : "bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent backdrop-blur-sm py-4"
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <NavLink to="/" className="group">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
                <span className="text-white font-bold text-xl">TZ</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                TURFZONE
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium transition-colors duration-300 group ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 transform origin-left transition-transform duration-300 ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span>{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50"
                  >
                    <NavLink to="/profile" className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <User className="w-4 h-4" /><span>Profile</span>
                    </NavLink>
                    <NavLink to="/my-bookings" className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <CalendarDays className="w-4 h-4" /><span>My Bookings</span>
                    </NavLink>
                    <NavLink to="/wallet" className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <Wallet className="w-4 h-4" /><span>Wallet</span>
                    </NavLink>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/login">
                  <button className="group flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">
                    <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Login</span>
                  </button>
                </NavLink>
                <NavLink to="/register">
                  <button className="relative flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-105">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </button>
                </NavLink>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Right Side */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Portal — always in DOM, animates via translate */}
      {drawerPortal}
    </>
  );
};

export default Navbar;