import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";

const StudentNavbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("student")) || {};
  const profileImage = user.imageUrl || null;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleStudentDetails = () => {
    setShowProfileMenu(false);
    navigate("/student/details");
  };

  const navLinks = [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Assessments", path: "/student/assessments" },
    { name: "Courses", path: "/student/courses" },
    { name: "Practice", path: "/student/practice" },
    { name: "Jobs", path: "/student/jobs" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 h-14 sm:h-16">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6">
          <button
            className="md:hidden p-1.5 sm:p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 active:bg-gray-200"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          <Link to="/student/dashboard" className="flex items-center">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
              Velocitix AI
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive(link.path)
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors duration-200 active:bg-gray-100">
            <Bell className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </nav>
        <div ref={profileRef} className="relative ml-2">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 group"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center transform transition-transform duration-200 hover:scale-105">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {user.name ? user.name[0].toUpperCase() : "S"}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left group-hover:text-blue-600 transition-colors duration-200">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 flex items-center">
                {user.name}
                <ChevronDown className="h-4 w-4 ml-1" />
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </button>
          {showProfileMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto sm:w-56 top-16 sm:mt-2 bg-white rounded-lg shadow-xl py-1 z-50 border">
              <div className="sticky top-0 px-4 py-3 border-b bg-white">
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 break-words">
                  {user.email}
                </p>
              </div>
              <div className="p-1 sm:p-0">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/student/profilesettings");
                  }}
                  className="flex items-center w-full px-3 sm:px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
                >
                  Profile
                </button>
                <button
                  onClick={handleStudentDetails}
                  className="flex items-center w-full px-3 sm:px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
                >
                  Student Details
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 sm:px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-200 border-t"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="flex flex-col px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-base font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.name}
              </Link>
            ))}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors duration-200 active:bg-gray-100 text-left">
              <Bell className="h-5 w-5 md:h-6 md:w-6" /> Notifications
            </button>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                navigate("/student/profilesettings");
                setShowMobileMenu(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
            >
              Profile
            </button>
            <button
              onClick={handleStudentDetails}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
            >
              Student Details
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-200 border-t"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default StudentNavbar;
