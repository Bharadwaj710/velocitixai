import React, { useState, useEffect, useRef } from 'react';
import { Users, UserCheck, TrendingUp, Search, Building2, Mail, BookOpen, Trophy, X } from 'lucide-react';

// Mock API functions - replace with actual API calls
const mockAPI = {
  getStudents: () => Promise.resolve([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      domain: "Full Stack Development",
      level: "Advanced",
      progress: 85,
      completedCourses: 12,
      totalCourses: 15,
      isHired: false
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike.chen@email.com",
      domain: "Data Science",
      level: "Intermediate",
      progress: 72,
      completedCourses: 8,
      totalCourses: 12,
      isHired: false
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      domain: "UI/UX Design",
      level: "Advanced",
      progress: 94,
      completedCourses: 15,
      totalCourses: 16,
      isHired: false
    },
    {
      id: 4,
      name: "Alex Thompson",
      email: "alex.t@email.com",
      domain: "DevOps",
      level: "Beginner",
      progress: 45,
      completedCourses: 5,
      totalCourses: 10,
      isHired: false
    },
    {
      id: 5,
      name: "Jessica Park",
      email: "jessica.p@email.com",
      domain: "Mobile Development",
      level: "Intermediate",
      progress: 68,
      completedCourses: 9,
      totalCourses: 14,
      isHired: false
    }
  ]),
  
  getHiredStudents: () => Promise.resolve([
    {
      id: 101,
      name: "David Wilson",
      email: "david.w@email.com",
      domain: "Full Stack Development",
      company: "TechCorp Inc",
      hiredDate: "2024-01-15"
    },
    {
      id: 102,
      name: "Lisa Garcia",
      email: "lisa.g@email.com",
      domain: "Data Science",
      company: "DataFlow Solutions",
      hiredDate: "2024-01-08"
    }
  ]),
  
  hireStudent: (studentId, companyName) => {
    return Promise.resolve({ success: true, studentId, companyName });
  }
};

// Shared Navbar Component
const Navbar = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Velocitix</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              HR Dashboard
            </span>
            {/* Profile Avatar with Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center focus:outline-none"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Profile
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4zm6-4c0-3.31-2.69-6-6-6s-6 2.69-6 6H2c0-4.42 3.58-8 8-8s8 3.58 8 8h-2z" /></svg>
                    Settings
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4 mr-2 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Student Card Component
const StudentCard = ({ student, onHire }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 'Advanced': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <Mail className="w-4 h-4 mr-1" />
            <span className="text-sm">{student.email}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(student.level)}`}>
          {student.level}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Domain</p>
          <p className="font-medium text-gray-900">{student.domain}</p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{student.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${student.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <BookOpen className="w-4 h-4 mr-1" />
            <span className="text-sm">{student.completedCourses}/{student.totalCourses} Courses</span>
          </div>
          <button
            onClick={() => onHire(student)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Hire
          </button>
        </div>
      </div>
    </div>
  );
};

// Hire Modal Component
const HireModal = ({ student, isOpen, onClose, onConfirm }) => {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = () => {
    if (companyName.trim()) {
      onConfirm(student.id, companyName.trim());
      setCompanyName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hire Student</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">You are about to hire:</p>
          <p className="font-semibold text-gray-900">{student?.name}</p>
          <p className="text-sm text-gray-600">{student?.email}</p>
        </div>
        
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Confirm Hire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hired Students Modal Component
const HiredStudentsModal = ({ isOpen, onClose, hiredStudents }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Hired Students</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {hiredStudents.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students hired yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Domain</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hired Date</th>
                  </tr>
                </thead>
                <tbody>
                  {hiredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                      <td className="py-3 px-4 text-gray-600">{student.domain}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium text-gray-900">{student.company}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(student.hiredDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main HR Dashboard Component
const HRDashboard = () => {
  const [activeSection, setActiveSection] = useState('students');
  const [students, setStudents] = useState([]);
  const [hiredStudents, setHiredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showHiredModal, setShowHiredModal] = useState(false);

  // Mock user role - replace with actual auth context
  const userRole = 'hr';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, hiredData] = await Promise.all([
        mockAPI.getStudents(),
        mockAPI.getHiredStudents()
      ]);
      setStudents(studentsData);
      setHiredStudents(hiredData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHireStudent = (student) => {
    setSelectedStudent(student);
    setShowHireModal(true);
  };

  const confirmHire = async (studentId, companyName) => {
    try {
      await mockAPI.hireStudent(studentId, companyName);
      
      // Move student from students to hired students
      const student = students.find(s => s.id === studentId);
      if (student) {
        const hiredStudent = {
          ...student,
          company: companyName,
          hiredDate: new Date().toISOString()
        };
        
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setHiredStudents(prev => [...prev, hiredStudent]);
      }
      
      setShowHireModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error hiring student:', error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageProgress = students.length > 0 
    ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length)
    : 0;

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === 'hired') {
      setShowHiredModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar userRole={userRole} activeSection={activeSection} onSectionChange={handleSectionChange} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={userRole} activeSection={activeSection} onSectionChange={handleSectionChange} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Students"
            value={students.length}
            icon={Users}
            color="blue"
          />
          <div onClick={() => setShowHiredModal(true)} className="cursor-pointer">
            <StatsCard
              title="Total Hired"
              value={hiredStudents.length}
              icon={UserCheck}
              color="green"
            />
          </div>
          <StatsCard
            title="Average Progress"
            value={`${averageProgress}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* All Students Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">All Students</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No students found matching your search' : 'No students available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onHire={handleHireStudent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hire Modal */}
      <HireModal
        student={selectedStudent}
        isOpen={showHireModal}
        onClose={() => {
          setShowHireModal(false);
          setSelectedStudent(null);
        }}
        onConfirm={confirmHire}
      />

      {/* Hired Students Modal */}
      <HiredStudentsModal
        isOpen={showHiredModal}
        onClose={() => setShowHiredModal(false)}
        hiredStudents={hiredStudents}
      />
    </div>
  );
};

export default HRDashboard;