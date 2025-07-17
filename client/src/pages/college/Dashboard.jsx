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
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [hiredOpen, setHiredOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsModalOpen, setStudentDetailsModalOpen] = useState(false);
  const [studentProgressModalOpen, setStudentProgressModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentProgress, setStudentProgress] = useState([]);
  const [allCoursesProgress, setAllCoursesProgress] = useState({});
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const collegeSlug = user?.collegeSlug;
  const [availableDomains, setAvailableDomains] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/college/students/${collegeSlug}`);
        setStudentsData(res.data.students);
        // Log the first student object for debugging
        if (res.data.students && res.data.students.length > 0) {
          console.log('Sample student object:', res.data.students[0]);
        } else {
          console.log('No students returned from backend');
        }
      } catch (err) {
        setStudentsData([]);
      } finally {
        setLoading(false);
      }
    };
    if (collegeSlug) fetchStudents();
  }, [collegeSlug]);

  // Fetch all students' progress for progress bars
  useEffect(() => {
    const fetchAllStudentsProgress = async () => {
      const progressMap = {};
      await Promise.all(studentsData.map(async (student) => {
        const studentKey = student._id || student.id;
        if (student.course && student.course.length > 0) {
          const progresses = await Promise.all(
            student.course.map(async (c) => {
              try {
                const res = await axios.get(`/api/progress/${student.user?._id || student.user}/${c._id}`);
                const totalLessons = c.weeks?.reduce((acc, w) => acc + (w.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0) || 0), 0) || 0;
                const completed = res.data.completedLessons?.length || 0;
                return totalLessons ? (completed / totalLessons) * 100 : 0;
              } catch {
                return 0;
              }
            })
          );
          const avg = progresses.length > 0 ? progresses.reduce((a, b) => a + b, 0) / progresses.length : 0;
          progressMap[studentKey] = Math.round(avg);
        } else {
          progressMap[studentKey] = 0;
        }
      }));
      setAllCoursesProgress(progressMap);
    };
    if (studentsData.length > 0) fetchAllStudentsProgress();
  }, [studentsData]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/career-assessment/filters');
        setAvailableDomains(res.data.domains || []);
        setAvailableSkills(res.data.skills || []);
      } catch (err) {
        console.error('Error fetching domain/skill filters:', err);
      }
    };
    fetchFilterOptions();
  }, []);

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

  // Get unique domains and skills from studentsData
  const allDomains = Array.from(new Set(studentsData.map(s => s.domain).filter(Boolean)));
  const allSkills = Array.from(new Set(studentsData.flatMap(s => s.skills || []).filter(Boolean)));

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchesDomain = selectedDomain === 'all' || student.domain === selectedDomain;
      const matchesSkill = selectedSkill === 'all' || (student.skills && student.skills.includes(selectedSkill));
      const matchesSearch =
        (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.coursePath?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      return matchesDomain && matchesSkill && matchesSearch;
    });
  }, [selectedDomain, selectedSkill, searchTerm, studentsData]);

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
            <span className="text-2xl md:text-3xl font-bold text-black tracking-tight capitalize text-center">
              {slug.replace(/-/g, ' ')} College Dashboard
            </span>
          </div>
          {/* College Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            {/* Profile Avatar */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center space-x-3 focus:outline-none"
                onClick={() => setProfileMenuOpen((v) => !v)}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-gray-800 text-sm">{user?.name || "College"}</div>
                  <div className="text-xs text-gray-500">{user?.email || "Email"}</div>
                </div>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-bold text-purple-700 text-base mb-1">{user?.name || "College"}</div>
                    <div className="text-xs text-gray-600 mb-1">{user?.email || "Email"}</div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">{user?.phoneNumber && <span className="mr-1">📞</span>}{user?.phoneNumber || "No phone"}</div>
                    <div className="flex items-center text-xs text-gray-500">{user?.address && <span className="mr-1">📍</span>}{user?.address || "No address"}</div>
                  </div>
                  <button
                    onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <span className="mr-2"></span> Logout
                  </button>
                </div>
              )}
            </div>
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
                                  {availableDomains.map(domain => (
                               <option key={domain} value={domain}>{domain}</option>
                            ))}
                  </select>

                  <select
                   value={selectedSkill}
                   onChange={(e) => setSelectedSkill(e.target.value)}
                   className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
              <option value="all">All Skills</option>
                         {availableSkills.map(skill => (
                     <option key={skill} value={skill}>{skill}</option>
                       ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredStudents.map((student) => (
                  <div key={student._id || student.id} className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition flex flex-col items-center border border-gray-100 min-w-0" style={{ minHeight: '260px' }}>
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                      {(student.name || student.user?.name || 'N/A')[0].toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 text-center mb-1">{student.name || student.user?.name || "N/A"}</h3>
                    <div className="text-gray-600 text-sm text-center mb-2">{student.user?.email || student.email || "N/A"}</div>
                    <div className="text-xs text-gray-500 mb-2">N/A</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full ${allCoursesProgress[student._id || student.id] > 0 ? 'bg-green-400' : 'bg-gray-300'}`} style={{ width: `${allCoursesProgress[student._id || student.id] || 0}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Progress: {allCoursesProgress[student._id || student.id] || 0}%</div>
                    <button
                      className="mt-1 w-full py-1.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition text-xs"
                      onClick={() => { setSelectedStudent(student); setStudentDetailsModalOpen(true); }}
                    >
                      View Details
                    </button>
                    <button
                      className="mt-1 w-full py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-xs"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                        setStudentProgressModalOpen(true);
                        // Fetch progress for all courses
                        if (student.course && student.course.length > 0) {
                          const progressArr = await Promise.all(
                            student.course.map(async (c) => {
                              try {
                                const res = await axios.get(`/api/progress/${student.user?._id || student.user}/${c._id}`);
                                const totalLessons = c.weeks?.reduce((acc, w) => acc + (w.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0) || 0), 0) || 0;
                                const completed = res.data.completedLessons?.length || 0;
                                return {
                                  courseName: c.title || c.name || c._id,
                                  percent: totalLessons ? Math.round((completed / totalLessons) * 100) : 0,
                                  completed,
                                  totalLessons,
                                };
                              } catch {
                                return { courseName: c.title || c.name || c._id, percent: 0, completed: 0, totalLessons: 0 };
                              }
                            })
                          );
                          setStudentProgress(progressArr);
                        } else {
                          setStudentProgress([]);
                        }
                      }}
                    >
                      View Progress
                    </button>
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
      {/* Student Details Modal */}
      {studentDetailsModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => setStudentDetailsModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              Student Details
            </h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Name:</span> {selectedStudent.user?.name || selectedStudent.name || 'N/A'}</div>
              <div><span className="font-semibold">Email:</span> {selectedStudent.user?.email || 'N/A'}</div>
              <div><span className="font-semibold">Roll Number:</span> {selectedStudent.rollNumber || 'N/A'}</div>
              <div><span className="font-semibold">College Course:</span> {selectedStudent.collegecourse || 'N/A'}</div>
              <div><span className="font-semibold">Branch:</span> {selectedStudent.branch || 'N/A'}</div>
              <div><span className="font-semibold">Year of Study:</span> {selectedStudent.yearOfStudy || 'N/A'}</div>
              <div><span className="font-semibold">College:</span> {selectedStudent.college || 'N/A'}</div>
              <div><span className="font-semibold">Phone Number:</span> {selectedStudent.phoneNumber || 'N/A'}</div>
              <div><span className="font-semibold">Address:</span> {selectedStudent.address || 'N/A'}</div>
              <div><span className="font-semibold">Skills:</span> {Array.isArray(selectedStudent.skills) && selectedStudent.skills.length > 0 ? selectedStudent.skills.join(', ') : 'N/A'}</div>
              <div><span className="font-semibold">Scorecard:</span> {selectedStudent.scorecard || 'N/A'}</div>
              <div><span className="font-semibold">Courses:</span> {Array.isArray(selectedStudent.course) && selectedStudent.course.length > 0 ? (
                <ul className="list-disc ml-6">
                  {selectedStudent.course.map((c, idx) => (
                    <li key={idx}>{c?.title || c?.name || c?._id || 'Unknown Course'}</li>
                  ))}
                </ul>
              ) : (
                <span>{selectedStudent.coursePath || 'N/A'}</span>
              )}</div>
              <div><span className="font-semibold">Hired:</span> {selectedStudent.hired?.isHired ? 'Yes' : 'No'}</div>
              {selectedStudent.hired?.isHired && (
                <>
                  <div><span className="font-semibold">Company Name:</span> {selectedStudent.hired.companyName || 'N/A'}</div>
                  <div><span className="font-semibold">Hired Date:</span> {selectedStudent.hired.hiredDate ? new Date(selectedStudent.hired.hiredDate).toLocaleDateString() : 'N/A'}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Student Progress Modal */}
      {studentProgressModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => { setStudentProgressModalOpen(false); setStudentProgress([]); }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              {selectedStudent.name}'s Course Progress
            </h2>
            {studentProgress.length > 0 ? (
              <ul className="space-y-4">
                {studentProgress.map((p, idx) => (
                  <li key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{p.courseName}</span>
                      <span className="text-sm text-gray-500">{p.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${p.percent}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{p.completed} of {p.totalLessons} lessons completed</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-600">No course progress found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDashboard;