import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ChevronDown, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminHeader = ({ notifications = [], sidebarOpen, setSidebarOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('admin')) || {};
  const profileImage = user.imageUrl ? `http://localhost:8080${user.imageUrl}` : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 h-14 sm:h-16">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6">
          <button
            className="md:hidden p-1.5 sm:p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 active:bg-gray-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
         <button
  onClick={() => {
    window.dispatchEvent(new CustomEvent('navigateToOverview'));
    setSidebarOpen(false);
  }}
  className="flex items-center"
>
  <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
    Velocitix AI
  </span>
</button>

        </div>

        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors duration-200 active:bg-gray-100"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:mt-2 w-auto sm:w-72 md:w-80 bg-white rounded-lg shadow-xl py-1 z-50 border max-h-[60vh] sm:max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 px-3 sm:px-4 py-2 border-b bg-white">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div
                      key={index}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50/80 active:bg-gray-100 cursor-pointer transition-colors duration-200"
                    >
                      <p className="text-sm text-gray-800 break-words">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time || '1 hour ago'}</p>
                    </div>
                  ))}
                  {notifications.length > 5 && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        window.dispatchEvent(new CustomEvent('navigateToRecentActivity'));
                      }}
                      className="text-blue-600 text-sm font-medium py-2 hover:underline w-full text-center border-t"
                    >
                      View More
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center transform transition-transform duration-200 hover:scale-105">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {user.name ? user.name[0].toUpperCase() : 'A'}
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
                  <p className="text-sm font-semibold text-gray-900 break-words">{user.name}</p>
                  <p className="text-xs text-gray-500 break-words">{user.email}</p>
                </div>
                <div className="p-1 sm:p-0">
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      window.dispatchEvent(new CustomEvent('navigateToSettings'));
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-3 sm:px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
                  >
                    Your Profile
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
      </div>
    </header>
  );
};

export default AdminHeader;
