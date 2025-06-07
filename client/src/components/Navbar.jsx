import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isActiveRoute = (path) => location.pathname === path;

  const handleLogout = () => {
    // Add your logout logic here
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Velocitix AI</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`nav-link ${isActiveRoute('/') && 'nav-link-active'}`}>
                Home
              </Link>
              <Link to="/features" className={`nav-link ${isActiveRoute('/features') && 'nav-link-active'}`}>
                Features
              </Link>
              <Link to="/about" className={`nav-link ${isActiveRoute('/about') && 'nav-link-active'}`}>
                About
              </Link>
              <Link to="/contact" className={`nav-link ${isActiveRoute('/contact') && 'nav-link-active'}`}>
                Contact
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <Link to="/login" className="btn">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
              <div className="ml-3 relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white p-1"
                >
                  <User className="h-6 w-6 text-gray-300" />
                </button>

                {showProfileMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            <Link to="/" className={`nav-link block ${isActiveRoute('/') && 'nav-link-active'}`}>
              Home
            </Link>
            <Link to="/features" className={`nav-link block ${isActiveRoute('/features') && 'nav-link-active'}`}>
              Features
            </Link>
            <Link to="/about" className={`nav-link block ${isActiveRoute('/about') && 'nav-link-active'}`}>
              About
            </Link>
            <Link to="/contact" className={`nav-link block ${isActiveRoute('/contact') && 'nav-link-active'}`}>
              Contact
            </Link>
            <div className="px-3 py-2 space-y-2">
              <Link to="/login" className="btn block text-center">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary block text-center">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;