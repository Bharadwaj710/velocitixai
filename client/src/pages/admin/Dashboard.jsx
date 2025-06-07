import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, Briefcase, TrendingUp, UserPlus, 
  Search, CheckCircle, Calendar
} from 'lucide-react';
import Student from './Student';
import Colleges from './Colleges';
import HRs from './HRs';
import AdminHeader from '../../components/AdminDashboard/AdminHeader';
import AdminSidebar from '../../components/AdminDashboard/AdminSidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Reset selectedRole when changing tabs
  useEffect(() => {
    if (activeTab !== 'users') {
      setSelectedRole('all');
    }
  }, [activeTab]);

  const dashboardStats = {
    totalUsers: 15420,
    students: 12340,
    colleges: 156,
    hrs: 234,
    pendingApprovals: 3,
    collegesOnboarded: 156,
    placementRate: 87.5
  };

  const notifications = [
    { id: 1, message: 'New college registration request' },
    { id: 2, message: 'New HR approval pending' },
    { id: 3, message: 'System update available' }
  ];

  const user = {
    name: 'Admin User',
    email: 'admin@velocitix.ai',
    role: 'admin'
  };

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
      className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
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
      <AdminHeader notifications={notifications} user={user} />
      
      <div className="flex">        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          notifications={notifications}
          setSelectedRole={setSelectedRole}
        />

        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Users" 
                  value={dashboardStats.totalUsers.toLocaleString()} 
                  icon={Users} 
                  change={12.5} 
                  color="blue" 
                  onClick={() => handleCardClick('total')}
                />
                <StatCard 
                  title="Active Students" 
                  value={dashboardStats.students.toLocaleString()} 
                  icon={GraduationCap} 
                  change={8.3} 
                  color="green" 
                  onClick={() => handleCardClick('students')}
                />
                <StatCard 
                  title="Partner Colleges" 
                  value={dashboardStats.colleges} 
                  icon={GraduationCap} 
                  change={15.2} 
                  color="purple" 
                  onClick={() => handleCardClick('colleges')}
                />
                <StatCard 
                  title="Active HRs" 
                  value={dashboardStats.hrs} 
                  icon={Briefcase} 
                  change={22.1} 
                  color="orange" 
                  onClick={() => handleCardClick('hrs')}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                  <QuickAction
                    icon={Users}
                    title="View User Details"
                    description="Manage user accounts"
                    onClick={() => {
                      setActiveTab('users');
                      setSelectedRole('all');
                    }}
                    color="green"
                  />
                  <QuickAction
                    icon={UserPlus}
                    title="Student Details"
                    description="Course and college info"
                    onClick={() => setActiveTab('students')}
                    color="blue"
                  />
                  <QuickAction
                    icon={CheckCircle}
                    title="Pending Approvals"
                    description={`${dashboardStats.pendingApprovals} waiting`}
                    onClick={() => setActiveTab('approvals')}
                    color="yellow"
                  />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <div key={notification.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">{index + 1} hour{index !== 0 ? 's' : ''} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'users' || activeTab === 'search-users') && (
            <Student 
              setShowUserModal={setShowUserModal} 
              setSelectedUser={setSelectedUser} 
              showUserModal={showUserModal} 
              selectedUser={selectedUser}
              selectedRole={selectedRole}
            />
          )}

          {activeTab === 'new-user' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              {/* Add your new user form here */}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Student Details</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Courses</option>
                    {/* Add course options */}
                  </select>
                  <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Colleges</option>
                    {/* Add college options */}
                  </select>
                </div>
              </div>
              {/* Add student table or grid here */}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <Colleges />
              <HRs />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
