import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Settings, Search, Book,
  LucideFileBarChart, Building2, Briefcase,Clock
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
    { key: 'users', label: 'User Management', Icon: Users },
    { key: 'students', label: 'Student Details', Icon: GraduationCap },
    { key: 'colleges', label: 'Partner Colleges', Icon: Building2 },
    { key: 'hrs', label: 'HR Management', Icon: Briefcase },
    { key: 'courses', label: 'Course Content', Icon: Book }
    
  ];

  const handleItemClick = (item) => {
    if (item.key === 'users') setSelectedRole('all');
    setActiveTab(item.key);
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
            {menuItems.map((item) => (
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
                </button>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
