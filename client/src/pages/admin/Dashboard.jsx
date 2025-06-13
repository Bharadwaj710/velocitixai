import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, Briefcase, TrendingUp, UserPlus, 
  Search, CheckCircle, Calendar, Book
} from 'lucide-react';
import UserList from './UserList';
import StudentList from './StudentList';
import Colleges from './Colleges';
import HRList from './HRList';
import AdminHeader from '../../components/AdminDashboard/AdminHeader';
import AdminSidebar from '../../components/AdminDashboard/AdminSidebar';
import { fetchOverviewStats } from '../../services/api';


const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    partnerColleges: 0,
    activeHRs: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Reset selectedRole when changing tabs
  const notifications = [
    { id: 1, message: "New college registration request" },
    { id: 2, message: "New HR approval pending" },
    { id: 3, message: "System update available" },
  ];

  const user = {
    name: "Admin User",
    email: "admin@velocitix.ai",
    role: "admin",
  };
  useEffect(() => {
    setStatsLoading(true);
    fetchOverviewStats()
      .then(res => {
        console.log('Overview stats:', res.data);
        setDashboardStats({
          totalUsers: res.data.totalUsers,
          activeStudents: res.data.activeStudents,
          partnerColleges: res.data.partnerColleges,
          activeHRs: res.data.activeHRs,
        });
        setStatsError(null);
      })
      .catch((err) => {
        setStatsError('Failed to load stats');
        console.error('Failed to fetch overview stats:', err);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const handleCardClick = (filterType) => {
    setActiveTab('users');
    const filterStates = {
      'total': 'all',
      'students': 'student',
      'colleges': 'college',
      'hrs': 'hr'
    };
    setSelectedRole(filterStates[filterType]);
  };
  const StatCard = ({ title, value, icon: Icon, change, color = 'blue', onClick }) => (
    <div 
      className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all duration-200 transform hover:-translate-y-1 select-none"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-sm text-gray-600 line-clamp-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-1 flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full bg-${color}-100 flex-shrink-0 ml-2`}>
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, onClick, color }) => {
    const colorMap = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200',
      green: 'from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200',
      orange: 'from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200'
    };

    const iconColors = {
      blue: 'text-blue-600 group-hover:text-blue-700',
      green: 'text-green-600 group-hover:text-green-700',
      yellow: 'text-yellow-600 group-hover:text-yellow-700',
      purple: 'text-purple-600 group-hover:text-purple-700',
      orange: 'text-orange-600 group-hover:text-orange-700'
    };

    return (
      <button
        onClick={onClick}
        className={`group flex items-center p-4 bg-gradient-to-br ${colorMap[color]} 
          border rounded-lg transition-all duration-300 
          hover:shadow-md hover:-translate-y-0.5 transform 
          relative overflow-hidden w-full`}
      >
        <div className={`flex items-center justify-center transition-transform duration-300 
          group-hover:scale-110 relative z-10`}>
          <Icon className={`h-8 w-8 mr-3 transition-colors duration-300 ${iconColors[color]}`} />
          <div className="text-left">
            <div className={`font-semibold text-gray-900 transition-colors duration-300 
              group-hover:text-gray-800`}>{title}</div>
            <div className="text-sm text-gray-600 group-hover:text-gray-700 
              transition-colors duration-300">{description}</div>
          </div>
        </div>
      </button>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        notifications={notifications}
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Fixed sidebar for desktop, sliding for mobile */}
        <div className="md:relative md:block">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSidebarOpen(false);
            }}
            notifications={notifications}
            setSelectedRole={setSelectedRole}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        {/* Main content - automatically adjusts for sidebar */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out
          ${sidebarOpen ? "md:pl-64" : ""} w-full
          p-4 md:p-6 pb-16`}
        >
          {activeTab === "overview" && (
            <div className="space-y-4 md:space-y-6">
              {statsError && (
                <div className="text-red-500 text-sm">{statsError}</div>
              )}
              {statsLoading ? (
                <div className="text-center py-8">Loading stats...</div>
              ) : (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <StatCard 
                      title="Total Users" 
                      value={dashboardStats.totalUsers?.toLocaleString?.() ?? 0} 
                      icon={Users} 
                      change={12.5} 
                      color="blue" 
                      onClick={() => handleCardClick('total')}
                    />
                    <StatCard 
                      title="Active Students" 
                      value={dashboardStats.activeStudents?.toLocaleString?.() ?? 0} 
                      icon={GraduationCap} 
                      change={8.3} 
                      color="green" 
                      onClick={() => setActiveTab('students')}
                    />
                    <StatCard 
                      title="Partner Colleges" 
                      value={dashboardStats.partnerColleges?.toLocaleString?.() ?? 0} 
                      icon={GraduationCap} 
                      change={15.2} 
                      color="purple" 
                      onClick={() => setActiveTab('colleges')}
                    />
                    <StatCard 
                      title="Active HRs" 
                      value={dashboardStats.activeHRs?.toLocaleString?.() ?? 0} 
                      icon={Briefcase} 
                      change={22.1} 
                      color="orange" 
                      onClick={() => setActiveTab('hrs')}
                    />
                  </div>
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-xl border">
                    <h3 className="text-lg font-semibold mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {" "}
                      <QuickAction
                        icon={Users}
                        title="View User Details"
                        description="Manage user accounts"
                        onClick={() => {
                          setActiveTab("users");
                          setSelectedRole("all");
                        }}
                        color="green"
                      />
                      <QuickAction
                        icon={UserPlus}
                        title="Student Details"
                        description="Course and college info"
                        onClick={() => setActiveTab("students")}
                        color="blue"
                      />
                      <QuickAction
                        icon={CheckCircle}
                        title="Pending Approvals"
                        description={`${dashboardStats.pendingApprovals} waiting`}
                        onClick={() => setActiveTab("approvals")}
                        color="yellow"
                      />
                    </div>
                  </div>
                  {/* Recent Activity */}
                  <div className="bg-white p-6 rounded-xl border">
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {notifications.map((notification, index) => (
                        <div
                          key={notification.id}
                          className="flex items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="text-sm text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {index + 1} hour{index !== 0 ? "s" : ""} ago
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {(activeTab === "users" || activeTab === "search-users") && (
            <UserList
              setShowUserModal={setShowUserModal}
              setSelectedUser={setSelectedUser}
              showUserModal={showUserModal}
              selectedUser={selectedUser}
              selectedRole={selectedRole}
            />
          )}

          {activeTab === "students" && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Student Details
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="w-full sm:w-auto pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex-1 sm:flex-none text-sm border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All Courses</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">
                        Information Technology
                      </option>
                      <option value="Electronics">Electronics</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Mechanical">Mechanical</option>
                    </select>
                    <select
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="flex-1 sm:flex-none text-sm border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All Colleges</option>
                      {dashboardStats.colleges > 0 &&
                        Array.from({
                          length: Math.min(5, dashboardStats.colleges),
                        }).map((_, idx) => (
                          <option key={idx} value={`College ${idx + 1}`}>
                            College {idx + 1}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              <StudentList
                students={students}
                loading={loading}
                setSelectedUser={setSelectedUser}
                setShowUserModal={setShowUserModal}
              />
            </div>
          )}
          {activeTab === "colleges" && <Colleges />}
          {activeTab === "hrs" && <HRList />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
