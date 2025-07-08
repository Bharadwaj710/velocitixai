import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

// HR Navbar Component
const HRNavbar = ({ hrInfo }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center h-16">
        <h1 className="text-2xl font-bold text-blue-700">HR Dashboard</h1>
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center space-x-3 focus:outline-none"
            onClick={() => setShowProfileMenu((v) => !v)}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">
              {hrInfo?.company ? hrInfo.company.charAt(0).toUpperCase() : "H"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-gray-800 text-sm">
                {hrInfo?.company || "Company"}
              </div>
              <div className="text-xs text-gray-500">
                {hrInfo?.designation || "HR"}
              </div>
            </div>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-bold text-blue-700 text-base mb-1">
                  {hrInfo?.company || "Company"}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  {hrInfo?.designation || "HR"}
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  {hrInfo?.phoneNumber && <span className="mr-1">📞</span>}
                  {hrInfo?.phoneNumber || "No phone"}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {hrInfo?.address && <span className="mr-1">📍</span>}
                  {hrInfo?.address || "No address"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <span className="mr-2">🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [invitedStudents, setInvitedStudents] = useState([]);
  const [hrInfo, setHrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filterCourse, setFilterCourse] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterDomain, setFilterDomain] = useState("");
  const [filterSkills, setFilterSkills] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/api/hr/students");
      setStudents(res.data.students);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const fetchInvitedStudents = async () => {
    try {
      const res = await axios.get("/api/hr/invited");
      setInvitedStudents(res.data.students);
    } catch (err) {
      console.error("Error fetching invited students:", err);
    }
  };

  const fetchHRDetails = async () => {
    try {
      const res = await axios.get(`/api/hr/${user._id}/details`);
      setHrInfo(res.data.hr);
    } catch (err) {
      console.error("Error fetching HR details:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchInvitedStudents();
    fetchHRDetails();
    setLoading(false);
  }, []);
  useEffect(() => {
    let filtered = [...students];

    if (filterDomain.trim()) {
      filtered = filtered.filter((s) =>
        s.domain?.toLowerCase().includes(filterDomain.toLowerCase())
      );
    }

    // Filter by skills
    if (filterSkills.trim()) {
      filtered = filtered.filter((s) =>
        s.skills?.some((skill) =>
          skill.toLowerCase().includes(filterSkills.toLowerCase())
        )
      );
    }
    if (!filterDomain.trim() && !filterSkills.trim()) {
      filtered = [...students];
    }
    setFilteredStudents(filtered);
  }, [filterDomain, filterSkills, students]);

  const handleConfirmHire = async (student) => {
    if (!hrInfo || !hrInfo._id || !hrInfo.company) {
      toast.error("HR profile not found. Please re-login.");
      return;
    }

    try {
      const res = await axios.post("/api/hr/send-invite", {
        studentId: student._id,
        companyName: hrInfo.company,
        hrId: hrInfo._id,
      });

      if (res.data.success) {
        toast.success("Invitation sent successfully!");
        fetchInvitedStudents(); // refresh list
      } else {
        toast.error("Failed to send invitation");
      }
    } catch (err) {
      console.error("Error sending hire invitation:", err);
      toast.error("Error sending invite. Try again later.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-lg font-semibold">
        Loading...
      </div>
    );

  // Leaderboard logic (top 3 by progress)
  const leaderboard = [...students]
    .filter((s) => s.progress !== undefined)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3);

  // Stat cards data
  const statCards = [
    {
      title: "Total Students",
      value: students.length,
      icon: (
        <div className="p-2 bg-blue-100 rounded-lg">
          <span role="img" aria-label="users">
            👥
          </span>
        </div>
      ),
      color: "blue",
    },
    {
      title: "Leaderboard",
      value: (
        <div className="flex flex-col gap-1">
          {leaderboard.map((s, i) => (
            <span
              key={s._id}
              className="text-xs font-semibold text-gray-900 whitespace-normal break-words max-w-xs"
            >
              {i + 1}. {s.user?.name || "N/A"} ({s.progress || 0}%)
            </span>
          ))}
        </div>
      ),
      icon: (
        <div className="p-2 bg-yellow-100 rounded-lg">
          <span role="img" aria-label="trophy">
            🏆
          </span>
        </div>
      ),
      color: "yellow",
      leaderboard: true,
      onClick: () => setShowLeaderboard(true),
    },
    {
      title: "Invited Students",
      value: invitedStudents.length,
      icon: (
        <div className="p-2 bg-green-100 rounded-lg">
          <span role="img" aria-label="invite">
            ✉️
          </span>
        </div>
      ),
      color: "green",
    },
  ];

  // Helper for student avatar
  const getAvatar = (name) => (name ? name.charAt(0).toUpperCase() : "S");

  const handleStudentClick = async (studentId) => {
    const res = await axios.get(`/api/hr/student-details/${studentId}`);
    setStudentDetails(res.data);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <HRNavbar hrInfo={hrInfo} />
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow p-6 flex items-center cursor-pointer"
              onClick={card.onClick}
            >
              {card.icon}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by domain"
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2"
          />
          <input
            type="text"
            placeholder="Filter by skills"
            value={filterSkills}
            onChange={(e) => setFilterSkills(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2"
          />
        </div>

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setShowLeaderboard(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span role="img" aria-label="trophy" className="mr-2">
                  🏆
                </span>
                Leaderboard
              </h2>
              <ol className="space-y-3">
                {[...students]
                  .filter((s) => s.progress !== undefined)
                  .sort((a, b) => (b.progress || 0) - (a.progress || 0))
                  .map((s, idx) => (
                    <li
                      key={s._id || idx}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold ${
                            idx === 0
                              ? "text-yellow-600"
                              : idx === 1
                              ? "text-gray-500"
                              : idx === 2
                              ? "text-orange-700"
                              : "text-gray-700"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-semibold">
                          {s.user?.name || "N/A"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {s.progress || 0}%
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        )}

        {/* All Students Grid */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          All Students
        </h2>
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-gray-500 text-center">
            No students found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition flex flex-col items-center border border-gray-100"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                  {getAvatar(student.user?.name)}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 text-center">
                  {student.user?.name || "N/A"}
                </h3>
                <div className="text-gray-600 text-sm text-center mb-2">
                  {student.user?.email || "N/A"}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {Array.isArray(student.course)
                    ? student.course.map((c) => c.title).join(", ") || "N/A"
                    : student.course?.title || "N/A"}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ width: `${student.progress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Progress: {student.progress || 0}%
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    className="px-4 py-2 bg-gray-100 text-blue-600 rounded-lg font-semibold shadow hover:bg-gray-200 transition"
                    onClick={() => handleStudentClick(student._id)}
                  >
                    View Details
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                    onClick={() => handleConfirmHire(student)}
                  >
                    Send Hire Invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal with Full Student Details */}
        {showModal && studentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-800 text-xl"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                {studentDetails.student.name}'s Details
              </h2>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <strong>Email:</strong> {studentDetails.student.user?.email}
                </p>
                <p>
                  <strong>College:</strong> {studentDetails.student.college}
                </p>
                <p>
                  <strong>Branch:</strong> {studentDetails.student.branch}
                </p>
                <p>
                  <strong>Roll No:</strong> {studentDetails.student.rollNumber}
                </p>
                <p>
                  <strong>College Course:</strong>{" "}
                  {studentDetails.student.collegecourse}
                </p>
                <p>
                  <strong>Domain:</strong>{" "}
                  {studentDetails.student.domain || "N/A"}
                </p>
                <p>
                  <strong>Skills:</strong>{" "}
                  {Array.isArray(studentDetails.student.skills) &&
                  studentDetails.student.skills.length > 0
                    ? studentDetails.student.skills.join(", ")
                    : "N/A"}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Course Progress
                </h3>
                <div className="space-y-4">
                  {studentDetails.student.course.map((course) => (
                    <div
                      key={course._id}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="font-semibold text-blue-600 text-md mb-1">
                        {course.title}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {course.description}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              studentDetails.courseProgressMap[course._id] || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-right text-gray-500 mt-1">
                        {studentDetails.courseProgressMap[course._id] || 0}%
                        completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
