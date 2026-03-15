import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, UserPlus, ChevronDown, LogOut, CalendarDays, Wallet } from "lucide-react";
import ThemeToggle from "../ToogleBTN/ThemeToggle"; // apna path adjust karo
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Sync user from localStorage (updates on login/logout across tabs too)
  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

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

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled
  ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg py-2"
  : "bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent backdrop-blur-sm py-4"
      }`}
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

        {/* Desktop Right Side - Auth + Theme Toggle */}
        <div className="hidden md:flex items-center space-x-3">

          {user ? (
            /* ---- LOGGED IN: Avatar + Dropdown ---- */
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
                  <NavLink to="/bookings" className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors">
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
            /* ---- LOGGED OUT: original Login + Sign Up ---- */
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
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </NavLink>
            </>
          )}

          {/* 👇 Theme Toggle Button - Desktop */}
          <ThemeToggle />
        </div>

        {/* Mobile Right Side - Theme Toggle + Hamburger */}
        <div className="md:hidden flex items-center space-x-2">
          {/* 👇 Theme Toggle Button - Mobile */}
          <ThemeToggle />

         <button
  onClick={() => setIsOpen(!isOpen)}
  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-colors"
  aria-label="Toggle menu"
>
  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
</button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-gray-900/95 dark:bg-gray-900/95 bg-white/95 backdrop-blur-lg border-t border-gray-800 dark:border-gray-800 border-gray-200 shadow-xl transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
             <NavLink
  key={link.path}
  to={link.path}
  className={({ isActive }) =>
    `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-gray-900 dark:text-white border-l-4 border-green-500"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
    }`
  }
>
  {link.label}
</NavLink>
            ))}
          </nav>

          <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800 dark:border-gray-800 border-gray-200">
            {user ? (
              /* ---- LOGGED IN: Mobile user section ---- */
              <>
                <div className="flex items-center space-x-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                <NavLink to="/profile">
                  <button className="w-full flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    <User className="w-4 h-4" /><span>Profile</span>
                  </button>
                </NavLink>
                <NavLink to="/bookings">
                  <button className="w-full flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    <CalendarDays className="w-4 h-4" /><span>My Bookings</span>
                  </button>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /><span>Logout</span>
                </button>
              </>
            ) : (
              /* ---- LOGGED OUT: original mobile Login + Sign Up ---- */
              <>
                <NavLink to="/login">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-600 bg-gray-800/50 dark:bg-gray-800/50 bg-gray-100 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </NavLink>
                <NavLink to="/register">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </button>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;