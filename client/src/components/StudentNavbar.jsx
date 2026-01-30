import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, X } from "lucide-react";
import apiClient from "../api/apiClient";

const StudentNavbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const bellButtonRef = useRef(null);
  const mobileMenuRef = useRef(null); // Ref for the mobile menu container

  const user = JSON.parse(localStorage.getItem("student")) || {};
  const profileImage = user.imageUrl || null;
  const [backendNotifications, setBackendNotifications] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const [showNavLinks, setShowNavLinks] = useState(false);
  const [checkingDetails, setCheckingDetails] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile menu if click is outside profileRef
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }

      // Close notifications if click is outside bell button AND outside the notifications dropdown
      if (
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target) &&
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      // Close mobile menu if click is outside mobileMenuRef and not the menu button
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".md\\:hidden.p-1\\.5") // Check if click is not on the mobile menu toggle button
      ) {
        setShowMobileMenu(false);
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

  const handleRemoveNotification = async (id) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setBackendNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error removing notification:", error);
    }
  };

  // New function to clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      const studentId = user._id || user.id;
      if (!studentId) {
        console.warn("Student ID not found for clearing notifications.");
        return;
      }
      // Assuming an API endpoint to clear all notifications for a student
      await apiClient.delete(`/api/notifications/clear/${studentId}`);
      setBackendNotifications([]); // Clear all notifications from state
      setShowNotifications(false); // Close the dropdown after clearing
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  const handleStudentDetails = () => {
    setShowProfileMenu(false);
    navigate("/student/details");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const studentId = user._id || user.id;
        if (!studentId) {
          console.warn("Student ID not found for fetching notifications.");
          return;
        }
        const res = await apiClient.get(`/api/notifications/user/${studentId}`);
        const data = res.data;
        const filteredNotifications = Array.isArray(data)
          ? data.filter((n) => n.type === "new_course")
          : [];
        setBackendNotifications(filteredNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (user && (user._id || user.id)) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const checkStudentDetails = async () => {
      setCheckingDetails(true);
      const userObj = JSON.parse(localStorage.getItem("user")) || {}; // Assuming 'user' here is the general user object
      const userId = userObj.id || userObj._id;
      if (!userId) {
        setShowNavLinks(false);
        setCheckingDetails(false);
        return;
      }
      try {
        const res = await apiClient.get(`/api/students/details/${userId}`);
        const data = res.data;
        if (data || userId) {
          setShowNavLinks(true);
        } else {
          setShowNavLinks(false);
        }
      } catch (error) {
        console.error("Error checking student details:", error);
        setShowNavLinks(false);
      }
      setCheckingDetails(false);
    };
    checkStudentDetails();
  }, [location.pathname]);

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

        {showNavLinks && !checkingDetails && (
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
                aria-label={link.name}
              >
                {link.name}
              </Link>
            ))}
            <div className="relative">
              <button
                ref={bellButtonRef}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors duration-200 active:bg-gray-100"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                {backendNotifications.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {backendNotifications.length}
                  </span>
                )}
              </button>

              {/* Desktop Notification Dropdown */}
              {showNotifications && (
                <div
                  ref={notificationsDropdownRef}
                  className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-[1000]
                             transform origin-top-right transition-all duration-200 ease-out
                             opacity-100 scale-100 animate-fade-in-scale"
                >
                  <div className="absolute -top-1 right-4 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></div>
                  <div className="py-1">
                    {backendNotifications.length > 0 ? (
                      <>
                        {/* Header for notifications with Clear All button */}
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-800">
                            Notifications
                          </h3>
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-xs font-small text-red-600 hover:text-red-800 hover:bg-red-100 py-1 px-2 rounded-md transition-colors duration-200"
                          >
                            Clear All
                          </button>
                        </div>
                        {/* Notification list */}
                        <div className="max-h-64 overflow-y-auto">
                          {" "}
                          {/* Added a scrollable div for notifications */}
                          {backendNotifications.map((n) => (
                            <div
                              key={n._id}
                              className="flex justify-between items-center px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div
                                className="text-sm text-gray-700 cursor-pointer hover:underline flex-grow pr-2"
                                onClick={() => {
                                  navigate(n.meta?.link || "/student/courses", {
                                    state: {
                                      courseId: n.meta?.courseId,
                                      highlight: true,
                                    },
                                  });
                                  setShowNotifications(false);
                                }}
                              >
                                {n.message}
                              </div>
                              <button
                                onClick={() => handleRemoveNotification(n._id)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors duration-150"
                                aria-label={`Remove notification: ${n.message}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        )}

        <div ref={profileRef} className="relative ml-2">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 group"
            aria-label="User profile menu"
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

          {/* Desktop Profile Dropdown */}
          {showProfileMenu && (
            <div
              className="hidden md:block absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50
                         transform origin-top-right transition-all duration-200 ease-out
                         opacity-100 scale-100 animate-fade-in-scale"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 break-words">
                  {user.email}
                </p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/student/profilesettings");
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-200"
                >
                  Profile
                </button>
                <button
                  onClick={handleStudentDetails}
                  className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-200"
                >
                  Student Details
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors duration-200 border-t border-gray-100 mt-1 pt-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)} // Close overlay on background click
        ></div>
      )}

      {/* Mobile Menu Content */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 md:hidden
                    transform transition-transform duration-300 ease-in-out
                    ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="text-lg font-bold text-blue-600">Menu</span>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {showNavLinks && !checkingDetails && (
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
                aria-label={link.name}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Notification Button (within mobile menu) */}
            <button
              className="relative flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              onClick={() => {
                setShowNotifications(!showNotifications);
                // Optionally, you might want to close the main mobile menu if notifications open
                // setShowMobileMenu(false);
              }}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {backendNotifications.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {backendNotifications.length}
                </span>
              )}
            </button>

            {/* Mobile Notification Dropdown (within mobile menu) */}
            {showNotifications && (
              <div className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-lg shadow-inner max-h-60 overflow-y-auto">
                {backendNotifications.length > 0 ? (
                  <>
                    {/* Header for notifications with Clear All button */}
                    <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 bg-white">
                      {" "}
                      {/* Added bg-white for contrast */}
                      <h3 className="text-sm font-semibold text-gray-800">
                        Notifications
                      </h3>
                      <button
                        onClick={() => {
                          handleClearAllNotifications();
                          setShowMobileMenu(false); // Close mobile menu after clearing
                        }}
                        className="text-xs font-small text-red-600 hover:text-red-800 hover:bg-red-100 py-1 px-2 rounded-md transition-colors duration-200"
                      >
                        Clear All
                      </button>
                    </div>
                    {/* Notification list */}
                    <div className="max-h-40 overflow-y-auto">
                      {" "}
                      {/* Adjusted max-height for mobile */}
                      {backendNotifications.map((n) => (
                        <div
                          key={n._id}
                          className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors duration-150"
                        >
                          <div
                            className="text-sm text-gray-700 cursor-pointer hover:underline flex-grow pr-2"
                            onClick={() => {
                              navigate(n.meta?.link || "/student/courses", {
                                state: {
                                  courseId: n.meta?.courseId,
                                  highlight: true,
                                },
                              });
                              setShowNotifications(false);
                              setShowMobileMenu(false);
                            }}
                          >
                            {n.message}
                          </div>
                          <button
                            onClick={() => handleRemoveNotification(n._id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100 transition-colors duration-150"
                            aria-label={`Remove notification: ${n.message}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No new notifications.
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setShowProfileMenu(false); // Not strictly needed for mobile profile, but good for consistency
                navigate("/student/profilesettings");
                setShowMobileMenu(false);
              }}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200"
            >
              Profile
            </button>
            <button
              onClick={handleStudentDetails}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200"
            >
              Student Details
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200 border-t border-gray-100 mt-1 pt-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </nav>
        )}
      </div>

      {/* Mobile Profile Menu (Full-screen bottom sheet style) */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            className="absolute bottom-0 left-0 w-full bg-white rounded-t-lg shadow-xl py-4 z-50
                       transform transition-transform duration-300 ease-out
                       animate-slide-up"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-between items-center px-4 pb-3 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center mr-3">
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
                <div>
                  <p className="text-base font-semibold text-gray-900 break-words">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 break-words">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileMenu(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close profile menu"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/student/profilesettings");
                }}
                className="flex items-center w-full px-3 py-2.5 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-200"
              >
                Profile
              </button>
              <button
                onClick={handleStudentDetails}
                className="flex items-center w-full px-3 py-2.5 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-200"
              >
                Student Details
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2.5 text-base text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors duration-200 border-t border-gray-100 mt-1 pt-2"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default StudentNavbar;
