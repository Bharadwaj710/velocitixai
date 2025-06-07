import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, GraduationCap, Settings, Menu, Search, Edit, 
  LucideFileBarChart, CheckCircle 
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, notifications = [], setSelectedRole = () => {} }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [subMenuTimer, setSubMenuTimer] = useState(null);
  const sidebarRef = useRef(null);

  const menuItems = [
    { key: 'overview', label: 'Overview', Icon: LucideFileBarChart },
    { key: 'users', label: 'User Management', Icon: Users, subItems: [
      { key: 'search-users', label: 'Search Users', Icon: Search },
      { key: 'edit-user', label: 'Edit User', Icon: Edit }
    ]},
    { key: 'students', label: 'Student Details', Icon: GraduationCap },
    { key: 'approvals', label: 'Approvals', Icon: CheckCircle, badge: notifications.length },
    { key: 'settings', label: 'Settings', Icon: Settings }
  ];

  const handleMouseEnter = (itemKey) => {
    if (subMenuTimer) {
      clearTimeout(subMenuTimer);
      setSubMenuTimer(null);
    }
    setHoveredItem(itemKey);
  };

  const handleMouseLeave = () => {
    if (subMenuTimer) {
      clearTimeout(subMenuTimer);
    }
    const timer = setTimeout(() => {
      setHoveredItem(null);
    }, 300); // Increased delay for better usability
    setSubMenuTimer(timer);
  };

  const handleItemClick = (item) => {
    if (item.subItems) {
      setActiveSubmenu(activeSubmenu === item.key ? null : item.key);
      // Don't set active tab for items with submenus when collapsed
      if (!isCollapsed) {
        setActiveTab(item.key);
      }
    } else {
      setActiveSubmenu(null);
      if (item.key === 'users') {
        setSelectedRole('all');
      }
      setActiveTab(item.key);
    }
  };

  useEffect(() => {
    return () => {
      if (subMenuTimer) clearTimeout(subMenuTimer);
    };
  }, [subMenuTimer]);

  // Reset active submenu when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setActiveSubmenu(null);
    }
  }, [isCollapsed]);

  return (
    <div 
      ref={sidebarRef}
      className={`h-full bg-white shadow-lg border-r transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => {
        setIsCollapsed(true);
        handleMouseLeave();
      }}
    >
      <div className="sticky top-0 bg-white p-4 border-b z-20">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg w-full flex items-center justify-center transition-colors duration-200"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <nav className="p-3 space-y-2.5 overflow-y-auto overflow-x-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {menuItems.map((item) => (
          <div key={item.key} className="relative group">
            <button
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => handleMouseEnter(item.key)}
              onMouseLeave={handleMouseLeave}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                activeTab === item.key || (item.subItems && item.subItems.some(sub => sub.key === activeTab))
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="relative flex items-center min-w-[24px] justify-center">
                <item.Icon className="h-5 w-5" />
                {item.badge && item.key === 'approvals' && isCollapsed && notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
              }`}>
                {item.label}
              </span>
              {item.badge && item.key === 'approvals' && !isCollapsed && notifications.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>

            {item.subItems && (
              (isCollapsed ? hoveredItem === item.key : activeSubmenu === item.key || hoveredItem === item.key)
            ) && (
              <div 
                className={`${
                  isCollapsed 
                    ? 'absolute left-full top-0 ml-1' 
                    : 'relative left-0 mt-1 ml-6'
                } bg-white rounded-lg shadow-lg py-1 min-w-[180px] z-50 border`}
                onMouseEnter={() => handleMouseEnter(item.key)}
                onMouseLeave={handleMouseLeave}
              >
                {item.subItems.map((subItem) => (
                  <button
                    key={subItem.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(subItem.key);
                      if (isCollapsed) {
                        handleMouseLeave();
                      }
                    }}
                    className={`w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors duration-200 ${
                      activeTab === subItem.key ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    <subItem.Icon className="h-4 w-4 mr-3" />
                    <span>{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
