import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ChevronDown, Menu } from 'lucide-react';

const AdminHeader = ({ notifications = [], recentActivity = [], sidebarOpen, setSidebarOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('admin')) || {};
  const profileImage = user.imageUrl || null; // ✅ Cloudinary-ready

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

const activityCount = Math.max(
  (Array.isArray(recentActivity) ? recentActivity.length : 0),
  (Array.isArray(notifications) ? notifications.length : 0)
);


  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 h-14 sm:h-16">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1.5 sm:p-2 rounded-md hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <button onClick={() => {
            window.dispatchEvent(new CustomEvent('navigateToOverview'));
            setSidebarOpen(false);
          }} className="flex items-center">
            <span className="text-lg font-bold text-blue-600">Velocitix AI</span>
          </button>
        </div>

        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-semibold text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">Admin Dashboard</h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigateToRecentActivity'));
                setShowNotifications(false);
              }}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <Bell className="h-5 w-5" />
              {activityCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {/* Show "9+" if more than 9 notifications */}
                  {activityCount > 9 ? '9+' : activityCount}
                </span>
              )}
            </button>
          </div>

          <div ref={profileRef} className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-semibold text-lg">{user.name ? user.name[0].toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 flex items-center">{user.name}<ChevronDown className="h-4 w-4 ml-1" /></p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-1 border">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold text-gray-900 break-words">{user.name}</p>
                  <p className="text-xs text-gray-500 break-words">{user.email}</p>
                </div>
                <div>
                  <button onClick={() => {
                    setSidebarOpen(false);
                    window.dispatchEvent(new CustomEvent('navigateToSettings'));
                    setShowProfileMenu(false);
                  }} className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Your Profile</button>
                  <button onClick={handleLogout} className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t flex items-center">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
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
