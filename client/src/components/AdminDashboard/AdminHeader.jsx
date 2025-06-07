import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Home, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminHeader = ({ notifications = [], user = {} }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

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
    // Add logout logic here
    console.log('Logging out...');
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40 pl-16">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">Velocitix AI</span>
          </Link>
        </div>

        {/* Admin Dashboard Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent px-4 py-1 rounded-lg">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div ref={notificationRef} className="relative">
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-gray-50 border-b last:border-b-0">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time || '1 hour ago'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
            <Settings className="h-6 w-6" />
          </button>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center transform transition-transform duration-200 hover:scale-105">
                <span className="text-white font-semibold text-lg">
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left group-hover:text-blue-600 transition-colors duration-200">
                <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 flex items-center">
                  {user.name || 'Admin User'} 
                  <ChevronDown className="h-4 w-4 ml-1" />
                </p>
                <p className="text-xs text-gray-500">{user.email || 'admin@velocitix.ai'}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-semibold text-gray-900">{user.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user.email || 'admin@velocitix.ai'}</p>
                </div>
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Your Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
