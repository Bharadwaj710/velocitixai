import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom'; // ✅ this is new
import {
  Users, BarChart3, Settings, LogOut, Download,
  Filter, Search, Menu, X, GraduationCap,
  Mail, Trophy, BookOpen
} from 'lucide-react';

const CollegeDashboard = () => {
  const { slug } = useParams(); // ✅ this reads /college-dashboard/:slug
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarHovered, setSidebarHovered] = useState(false);


  // Dummy student data
  const studentsData = [
    {
      id: 1,
      name: "Arjun Sharma",
      email: "arjun.sharma@college.edu",
      avatar: "AS",
      coursePath: "Full Stack Developer Path",
      progress: 78,
      domain: "Tech",
      level: "Intermediate",
      completedCourses: 5,
      totalCourses: 8
    },
    {
      id: 2,
      name: "Priya Patel",
      email: "priya.patel@college.edu",
      avatar: "PP",
      coursePath: "Digital Marketing Specialist",
      progress: 92,
      domain: "Marketing",
      level: "Proficient",
      completedCourses: 7,
      totalCourses: 8
    },
    {
      id: 3,
      name: "Rohit Kumar",
      email: "rohit.kumar@college.edu",
      avatar: "RK",
      coursePath: "Data Science Path",
      progress: 45,
      domain: "Tech",
      level: "Beginner",
      completedCourses: 3,
      totalCourses: 10
    },
    {
      id: 4,
      name: "Sneha Gupta",
      email: "sneha.gupta@college.edu",
      avatar: "SG",
      coursePath: "Business Analytics Path",
      progress: 88,
      domain: "Business",
      level: "Proficient",
      completedCourses: 6,
      totalCourses: 7
    },
    {
      id: 5,
      name: "Vikram Singh",
      email: "vikram.singh@college.edu",
      avatar: "VS",
      coursePath: "Frontend Developer Path",
      progress: 34,
      domain: "Tech",
      level: "Beginner",
      completedCourses: 2,
      totalCourses: 6
    },
    {
      id: 6,
      name: "Ananya Reddy",
      email: "ananya.reddy@college.edu",
      avatar: "AR",
      coursePath: "Content Marketing Path",
      progress: 67,
      domain: "Marketing",
      level: "Intermediate",
      completedCourses: 4,
      totalCourses: 6
    }
  ];

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchesDomain = selectedDomain === 'all' || student.domain === selectedDomain;
      const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.coursePath.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDomain && matchesLevel && matchesSearch;
    });
  }, [selectedDomain, selectedLevel, searchTerm]);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Course Path', 'Progress (%)', 'Domain', 'Level', 'Completed Courses', 'Total Courses'];
    const csvData = filteredStudents.map(student => [
      student.name,
      student.email,
      student.coursePath,
      student.progress,
      student.domain,
      student.level,
      student.completedCourses,
      student.totalCourses
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'students_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDomainColor = (domain) => {
    switch (domain) {
      case 'Tech': return 'bg-blue-100 text-blue-800';
      case 'Marketing': return 'bg-green-100 text-green-800';
      case 'Business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-yellow-100 text-yellow-800';
      case 'Intermediate': return 'bg-orange-100 text-orange-800';
      case 'Proficient': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Update Sidebar to accept hover handlers
  const Sidebar = ({ onHover, onLeave }) => (
    <div
      className="group fixed inset-y-0 left-0 z-50 w-20 hover:w-64 bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Top section */}
      <div className="flex items-center justify-center group-hover:justify-start h-16 px-4 border-b transition-all">
        <GraduationCap className="h-6 w-6 text-blue-600" />
        <span className="ml-3 text-xl font-bold text-gray-900 hidden group-hover:inline">
          Velocitix AI
        </span>
      </div>

      {/* Nav Links */}
      <nav className="mt-4 flex-1 space-y-1 px-2">
        <a href="#" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-all">
          <BarChart3 className="h-5 w-5" />
          <span className="ml-3 hidden group-hover:inline">Dashboard</span>
        </a>
        <a href="#" className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all">
          <Users className="h-5 w-5" />
          <span className="ml-3 hidden group-hover:inline">Students</span>
        </a>
        <a href="#" className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all">
          <BarChart3 className="h-5 w-5" />
          <span className="ml-3 hidden group-hover:inline">Analytics</span>
        </a>
        <a href="#" className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all">
          <Settings className="h-5 w-5" />
          <span className="ml-3 hidden group-hover:inline">Settings</span>
        </a>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen overflow-auto bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        onHover={() => setSidebarHovered(true)}
        onLeave={() => setSidebarHovered(false)}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarHovered ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">College Dashboard</h1>
                <p className="text-sm text-gray-600 capitalize">{slug} College Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              
              <button className="inline-flex items-center px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{studentsData.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(studentsData.reduce((acc, student) => acc + student.progress, 0) / studentsData.length)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Courses</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters and search */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                      />
                    </div>
                    
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Domains</option>
                      <option value="Tech">Tech</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Business">Business</option>
                    </select>
                    
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Proficient">Proficient</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Showing {filteredStudents.length} of {studentsData.length} students
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Student cards/table */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {student.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">{student.coursePath}</p>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDomainColor(student.domain)}`}>
                            {student.domain}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.level)}`}>
                            {student.level}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.completedCourses}/{student.totalCourses} courses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollegeDashboard;