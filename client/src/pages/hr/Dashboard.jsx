import React, { useState, useEffect, useRef } from 'react';
import { Users, UserCheck, TrendingUp, Search, Mail, Building2, Phone, MapPin, GraduationCap, Trophy, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from "axios";

// Navbar Component
const Navbar = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const [hrInfo, setHrInfo] = useState(null);

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

  useEffect(() => {
    const fetchHRDetails = async () => {
      try {
        const loggedUser = JSON.parse(localStorage.getItem("user"));
        const userId = loggedUser?._id || loggedUser?.id;
        if (!userId) {
          console.error("No user ID found in localStorage for HR details fetch");
          return;
        }
        const res = await axios.get(`http://localhost:8080/api/hr/${userId}/details`);
        setHrInfo(res.data.hr);
      } catch (error) {
        console.error("Error fetching HR profile:", error);
      }
    };

    fetchHRDetails();
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-blue-600">Velocitix</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              HR Dashboard
            </span>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                  {hrInfo && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-bold text-blue-700 text-base mb-1">{hrInfo.company}</div>
                      <div className="text-xs text-gray-600 mb-1">{hrInfo.designation}</div>
                      <div className="flex items-center text-xs text-gray-500 mb-1"><Phone className="w-3 h-3 mr-1" />{hrInfo.phoneNumber}</div>
                      <div className="flex items-center text-xs text-gray-500"><MapPin className="w-3 h-3 mr-1" />{hrInfo.address}</div>
                    </div>
                  )}
                  <Link
                    to="/hr/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4zm6-4c0-3.31-2.69-6-6-6s-6 2.69-6 6H2c0-4.42 3.58-8 8-8s8 3.58 8 8h-2z" /></svg>
                    Settings
                  </Link>
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
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
  const name = student.user?.name || "N/A";
  const email = student.user?.email || "N/A";
  const domain = student.domain || "N/A";
  const branch = student.branch || "N/A";
  return (
    <div className="rounded-xl shadow-lg border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50 to-purple-50 p-6 hover:shadow-2xl transition-shadow">
      <div className="flex items-center mb-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow bg-blue-100 text-blue-700 mr-4`}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center">
            {name}
            <span className="ml-2 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Student</span>
          </h3>
          <div className="flex items-center text-gray-600 mt-1">
            <Mail className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-sm">{email}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <GraduationCap className="w-5 h-5 text-purple-500 mr-2" />
          <span className="font-semibold text-purple-700">{domain}</span>
        </div>
        <div className="flex items-center">
          <Building2 className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="font-semibold text-yellow-700">{branch}</span>
        </div>
      </div>
      <button
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        onClick={() => onHire(student)}
      >
        Hire
      </button>
    </div>
  );
};

// Hire Modal
const HireModal = ({ student, isOpen, onClose, onConfirm }) => {
  const [companyName, setCompanyName] = useState("");
  useEffect(() => {
    setCompanyName("");
  }, [student, isOpen]);
  if (!isOpen || !student) return null;
  const name = student.user?.name || "N/A";
  const email = student.user?.email || "N/A";
  const branch = student.branch || "N/A";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center">
          <UserCheck className="h-6 w-6 mr-2 text-green-600" />
          Hire Student
        </h2>
        <div className="mb-4">
          <div className="mb-2 flex items-center">
            <span className="font-semibold text-gray-800 mr-2">Name:</span> {name}
          </div>
          <div className="mb-2 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-semibold text-gray-800 mr-2">Email:</span> {email}
          </div>
          <div className="mb-2 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="font-semibold text-gray-800 mr-2">Branch:</span> {branch}
          </div>
          <div className="mb-2">
            <label className="block text-gray-700 font-medium mb-1">Company Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />
          </div>
        </div>
        <button
          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          onClick={() => onConfirm(student, companyName)}
        >
          Send Hire Invitation
        </button>
      </div>
    </div>
  );
};

// Main HR Dashboard Component
const HRDashboard = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState('all');
  // Add invited students state
  const [invitedStudents, setInvitedStudents] = useState([]);
  const [showAllInvited, setShowAllInvited] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/hr/students");
        setStudents(res.data.students || []);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    // Fetch invited students for this HR
    const fetchInvited = async () => {
      try {
        const loggedUser = JSON.parse(localStorage.getItem("user"));
        const res = await axios.get(`http://localhost:8080/api/hr/${loggedUser.hrInfo?._id || loggedUser._id}/invited-students`);
        setInvitedStudents(
          (res.data.invitations || []).map(inv => ({
            _id: inv._id,
            name: inv.student?.user?.name,
            email: inv.student?.user?.email,
            branch: inv.student?.branch,
            invitedAt: inv.invitedAt
          }))
        );
      } catch (err) {
        setInvitedStudents([]);
      }
    };
    fetchInvited();
  }, []);

  const filteredStudents = students.filter((student) => {
    return (
      (student.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.domain || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.branch || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Leaderboard logic
  const sortedStudents = [...students].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const topThree = sortedStudents.slice(0, 3);
  const filteredLeaderboard = leaderboardFilter === 'all'
    ? sortedStudents
    : sortedStudents.filter(s => s.domain === leaderboardFilter);
  const allDomains = Array.from(new Set(students.map(s => s.domain).filter(Boolean)));

  const handleHireStudent = (student) => {
    setSelectedStudent(student);
    setShowHireModal(true);
  };

  const handleConfirmHire = async (student, companyName) => {
    try {
      const loggedUser = JSON.parse(localStorage.getItem("user"));
      const hrId = loggedUser.hrInfo?._id;
      if (!hrId) {
        alert("HR profile not found. Please re-login.");
        return;
      }
      const res = await axios.post('http://localhost:8080/api/hr/send-invite', {
        studentId: student._id,
        companyName,
        hrId
      });
      if (!res.data.success) {
        alert(res.data.message || 'Failed to send invitation.');
        return;
      }
      // Refetch invited students from backend
      const invitedRes = await axios.get(`http://localhost:8080/api/hr/${hrId}/invited-students`);
      setInvitedStudents(
        (invitedRes.data.invitations || []).map(inv => ({
          _id: inv._id,
          name: inv.student?.user?.name,
          email: inv.student?.user?.email,
          branch: inv.student?.branch,
          invitedAt: inv.invitedAt
        }))
      );
      setShowHireModal(false);
      setSelectedStudent(null);
    } catch (err) {
      if (err.response) {
        console.error('Error response:', err.response.data);
        alert(err.response.data.message || 'Failed to send invitation.');
      } else {
        alert('Failed to send invitation.');
      }
    }
  };

  // Add delete handler for invited students
  const handleRemoveInvitedStudent = async (invitationId) => {
    try {
      await axios.delete(`http://localhost:8080/api/hr/invited-students/${invitationId}`);
      setInvitedStudents(prev => prev.filter(s => s._id !== invitationId));
    } catch (err) {
      alert('Failed to remove invited student.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Students"
            value={students.length}
            icon={Users}
            color="blue"
          />
          <div onClick={() => setLeaderboardOpen(true)} className="cursor-pointer">
            <div className="rounded-xl shadow-lg border-2 border-yellow-100 bg-gradient-to-br from-white via-yellow-50 to-orange-50 p-6 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-2">
                <Trophy className="w-7 h-7 text-yellow-500 mr-3" />
                <div>
                  <div className="text-lg font-bold text-yellow-700">Leaderboard</div>
                  <div className="text-xs text-gray-500">Top 3 Students</div>
                </div>
              </div>
              <ol className="mt-2 space-y-1">
                {topThree.map((student, idx) => (
                  <li key={student._id || idx} className="flex items-center space-x-2">
                    <span className={`font-bold ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-500' : 'text-orange-700'}`}>#{idx + 1}</span>
                    <span className="font-semibold">{student.user?.name || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{student.progress}%</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {/* Invited Students Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-2">
              <Mail className="w-6 h-6 text-purple-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-purple-700">Invited Students</div>
                <div className="text-xs text-gray-500">Recently Invited</div>
              </div>
            </div>
            {invitedStudents.length === 0 ? (
              <div className="text-gray-400 text-sm mt-2">No students invited yet.</div>
            ) : (
              <>
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {(showAllInvited ? invitedStudents : invitedStudents.slice(0, 3)).map((s) => (
                    <li key={s._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{s.name}</span>
                        <span className="text-xs text-gray-500">{new Date(s.invitedAt).toLocaleDateString()} {new Date(s.invitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button onClick={() => handleRemoveInvitedStudent(s._id)} className="ml-2 text-gray-400 hover:text-red-500" title="Remove">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
                {invitedStudents.length > 3 && (
                  <button
                    className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none"
                    onClick={() => setShowAllInvited((prev) => !prev)}
                  >
                    {showAllInvited ? 'Show Less' : `Show All (${invitedStudents.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search + Cards */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <StudentCard key={student._id} student={student} onHire={handleHireStudent} />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">No students found</p>
            )}
          </div>
        </div>
      </div>

      <HireModal
        student={selectedStudent}
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        onConfirm={handleConfirmHire}
      />

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
            {/* Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Domain:</label>
              <select
                value={leaderboardFilter}
                onChange={e => setLeaderboardFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All Domains</option>
                {allDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <ol className="space-y-3">
              {filteredLeaderboard.map((student, idx) => (
                <li key={student._id || idx} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-500' : idx === 2 ? 'text-orange-700' : 'text-gray-700'}`}>#{idx + 1}</span>
                    <span className="font-semibold">{student.user?.name || 'N/A'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{student.progress}%</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
