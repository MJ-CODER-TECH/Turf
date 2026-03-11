import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogIn, UserPlus } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

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
          ? "bg-gray-900/95 backdrop-blur-lg shadow-lg py-2"
          : "bg-gradient-to-b from-gray-900/80 to-transparent backdrop-blur-sm py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo with enhanced styling */}
        <NavLink to="/" className="group">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
              <span className="text-white font-bold text-xl">TZ</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
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
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
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

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <NavLink to="/login">
            <button className="group flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300">
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
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 shadow-xl transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Mobile Nav Links */}
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-white border-l-4 border-green-500"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
            <NavLink to="/login">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-800/50 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;