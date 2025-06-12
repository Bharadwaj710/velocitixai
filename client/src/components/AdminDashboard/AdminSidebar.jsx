import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Settings, Search, Edit,
  LucideFileBarChart, Building2, Briefcase
} from 'lucide-react';

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  notifications = [],
  setSelectedRole = () => {},
  sidebarOpen,
  setSidebarOpen
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { key: 'overview', label: 'Overview', Icon: LucideFileBarChart },
    {
      key: 'users', label: 'User Management', Icon: Users, subItems: [
        { key: 'search-users', label: 'Search Users', Icon: Search },
        { key: 'edit-user', label: 'Edit User', Icon: Edit }
      ]
    },
    { key: 'students', label: 'Student Details', Icon: GraduationCap },
    { key: 'colleges', label: 'Partner Colleges', Icon: Building2 },
    { key: 'hrs', label: 'HR Management', Icon: Briefcase },
    { key: 'settings', label: 'Settings', Icon: Settings }
  ];

  const handleItemClick = (item) => {
    if (item.subItems && isMobile) {
      setExpandedMenu(expandedMenu === item.key ? null : item.key);
    } else {
      if (item.key === 'users') setSelectedRole('all');
      setActiveTab(item.key);
      if (isMobile) {
        setSidebarOpen(false);
        setExpandedMenu(null);
      }
    }
  };

  const handleSubItemClick = (subItem) => {
    setActiveTab(subItem.key);
    if (isMobile) {
      setSidebarOpen(false);
      setExpandedMenu(null);
    }
  };

  return (
    <>
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setExpandedMenu(null);
        }}
        className={`fixed md:sticky top-[64px] md:top-16 left-0 z-30 bg-white shadow border-r
        h-[calc(100vh-64px)] md:h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out
        ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'w-[80vw] max-w-xs pt-2' : isHovered ? 'w-64' : 'w-16'}`}
      >
        {isMobile && (
          <div className="flex items-center h-14 px-4 border-b">
            <span className="text-lg font-bold text-blue-600">Admin Dashboard</span>
          </div>
        )}

        <nav className="flex flex-col h-full overflow-y-auto">
          <div className="flex-1 p-2 space-y-1.5">
            {menuItems.map((item) => {
              const showSub = isMobile
                ? expandedMenu === item.key
                : isHovered && item.subItems;

              return (
                <div key={item.key} className="w-full">
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                      ${activeTab === item.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <item.Icon className="h-6 w-6 shrink-0" />
                    <span className={`ml-4 text-sm font-medium whitespace-nowrap transition-all duration-300
                      ${isHovered || isMobile ? 'opacity-100' : 'opacity-0 hidden md:block'}
                    `}>
                      {item.label}
                    </span>
                    {item.subItems && (
                      <svg
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          showSub ? 'rotate-180' : ''
                        } ${!isMobile && !isHovered ? 'hidden' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {item.subItems && showSub && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.key}
                          onClick={() => handleSubItemClick(subItem)}
                          className={`flex items-center w-full px-3 py-2 rounded-md text-sm
                            ${activeTab === subItem.key ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
                          `}
                        >
                          <subItem.Icon className="h-4 w-4 mr-2" />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
