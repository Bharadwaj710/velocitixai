import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, BarChart3, Settings, LogOut, Download,
  Filter, Search, Menu, X, GraduationCap,
  Mail, Trophy, BookOpen, Briefcase, User
} from 'lucide-react';
import axios from 'axios';

const CollegeDashboard = () => {
  const { slug } = useParams();
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [hiredOpen, setHiredOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const collegeSlug = user?.collegeSlug;

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/college/students/${collegeSlug}`);
        setStudentsData(res.data.students);
      } catch (err) {
        setStudentsData([]);
      } finally {
        setLoading(false);
      }
    };
    if (collegeSlug) fetchStudents();
  }, [collegeSlug]);

  // Leaderboard logic
  const [selectedCourse, setSelectedCourse] = useState('all');
  const allCourses = useMemo(() => {
    const courses = new Set();
    studentsData.forEach(student => {
      if (student.coursePath) courses.add(student.coursePath);
    });
    return Array.from(courses);
  }, [studentsData]);

  const leaderboardStudents = useMemo(() => {
    let filtered = studentsData;
    if (selectedCourse !== 'all') {
      filtered = studentsData.filter(s => s.coursePath === selectedCourse);
    }
    return [...filtered].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  }, [studentsData, selectedCourse]);
  const topThree = leaderboardStudents.slice(0, 3);
  // Hired students logic
  const hiredStudents = studentsData.filter(student => student.hired && student.company);

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchesDomain = selectedDomain === 'all' || student.domain === selectedDomain;
      const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
      const matchesSearch =
        (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.coursePath?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      return matchesDomain && matchesLevel && matchesSearch;
    });
  }, [selectedDomain, selectedLevel, searchTerm, studentsData]);

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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4 relative">
          <div className="absolute left-6 flex items-center">
            <h1 className="text-2xl font-bold text-purple-700">velocitiXai</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-extrabold text-lg text-gray-900 capitalize tracking-wide">{slug} College Dashboard</span>
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
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
               <p className="text-2xl font-bold text-gray-900">{studentsData.length}</p>

              </div>
            </div>
            
            {/* Leaderboard Card */}
            <div
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              onClick={() => setLeaderboardOpen(true)}
              title="Click to view full leaderboard"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Leaderboard</p>
                  <div>
                    {topThree.map((student, idx) => (
                      <div key={student._id || idx} className="flex items-center space-x-2">
                        <span className={`font-bold text-lg ${idx === 0 ? "text-yellow-600" : idx === 1 ? "text-gray-500" : "text-orange-700"}`}>#{idx + 1}</span>
                        <span className="font-semibold">{student.name}</span>
                        <span className="text-xs text-gray-500">{student.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Hired Card */}
            <div
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              onClick={() => setHiredOpen(true)}
              title="Click to view hired students"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hired</p>
                  <p className="text-2xl font-bold text-gray-900">{hiredStudents.length}</p>
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

      {/* Leaderboard Modal */}
      {leaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => setLeaderboardOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Trophy className="h-6 w-6 text-yellow-600 mr-2" />
              Leaderboard
            </h2>
            {/* Course Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Course:</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All Courses</option>
                {allCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <ol className="space-y-3">
              {leaderboardStudents.map((student, idx) => (
                <li key={student._id || idx} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${idx === 0 ? "text-yellow-600" : idx === 1 ? "text-gray-500" : idx === 2 ? "text-orange-700" : "text-gray-700"}`}>#{idx + 1}</span>
                    <span className="font-semibold">{student.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{student.progress}%</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {/* Hired Students Modal */}
      {hiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => setHiredOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Briefcase className="h-6 w-6 text-purple-600 mr-2" />
              Hired Students
            </h2>
            {hiredStudents.length > 0 ? (
              <ul className="space-y-3">
                {hiredStudents.map((student, idx) => (
                  <li key={student._id || idx} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                    <div>
                      <span className="font-semibold">{student.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({student.email})</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">{student.company}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-600">No students have been hired yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDashboard;