import React, { useEffect, useState, useRef, useMemo } from "react";
import apiClient from "../../api/apiClient";
import toast, { Toaster } from "react-hot-toast";

// HR Navbar Component (No changes needed here)
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
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-white font-bold text-lg">
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
  const [leaderboardDomain, setLeaderboardDomain] = useState("");
  const [leaderboardSkills, setLeaderboardSkills] = useState("");

  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterDomain, setFilterDomain] = useState("");
  const [filterSkills, setFilterSkills] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await apiClient.get(`/api/aiInterview/all-reports`);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    }
  };

  // Helper function to calculate average progress based on courseProgressMap
  const calculateAverageProgress = (courseProgressMap, courses) => {
    if (!courses || courses.length === 0) {
      return 0;
    }
    let totalProgress = 0;
    let coursesWithProgress = 0;

    courses.forEach((course) => {
      const progress = courseProgressMap[course._id];
      if (typeof progress === "number") {
        totalProgress += progress;
        coursesWithProgress++;
      }
    });

    if (coursesWithProgress === 0) {
      return 0;
    }
    return Math.round(totalProgress / coursesWithProgress);
  };

  const fetchStudents = async () => {
    try {
      const res = await apiClient.get("/api/hr/students");
      const studentsData = Array.isArray(res.data?.students)
        ? res.data.students
        : [];

      // --- START OF WORKAROUND FOR N+1 PROBLEM ---
      // Fetch detailed progress for each student
      const studentsWithDetailedProgress = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const detailRes = await apiClient.get(
              `/api/hr/student-details/${student._id}`
            );
            const { student: detailedStudent, courseProgressMap } =
              detailRes.data || {};

            // Calculate average progress using the detailed data
            const calculatedProgress = calculateAverageProgress(
              courseProgressMap,
              detailedStudent.course // Use the courses from detailed student data
            );

            return {
              ...student, // Keep original student data
              calculatedProgress, // Add the calculated average progress
              courseProgressMap: courseProgressMap, // Also store the map for modal
              detailedCourses: detailedStudent.course, // Store detailed courses for modal
            };
          } catch (detailErr) {
            console.warn(
              `Could not fetch details for student ${student._id}:`,
              detailErr
            );
            // Return student with 0 progress if details fetch fails
            return {
              ...student,
              calculatedProgress: 0,
              courseProgressMap: {},
              detailedCourses: [],
            };
          }
        })
      );
      // --- END OF WORKAROUND ---

      setStudents(studentsWithDetailedProgress);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to fetch student data.");
    }
  };

  const fetchInvitedStudents = async () => {
    try {
      const res = await apiClient.get("/api/hr/invited");
      setInvitedStudents(
        Array.isArray(res.data?.students) ? res.data.students : []
      );
    } catch (err) {
      console.error("Error fetching invited students:", err);
      toast.error("Failed to fetch invited students list.");
    }
  };

  const fetchHRDetails = async () => {
    try {
      const res = await apiClient.get(`/api/hr/${user._id}/details`);
      setHrInfo(res.data?.hr || null);
    } catch (err) {
      console.error("Error fetching HR details:", err);
      toast.error("Failed to fetch HR profile details.");
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      const [studentsRes, invitedRes, hrRes, reportsRes] =
        await Promise.allSettled([
          fetchStudents(),
          fetchInvitedStudents(),
          fetchHRDetails(),
          fetchReports(),
        ]);
      setLoading(false);
    };
    initializeDashboard();
  }, []);

  // Filter students based on domain and skills
  useEffect(() => {
    let filtered = [...students];

    if (filterDomain.trim()) {
      filtered = filtered.filter(
        (s) => s.domain?.toLowerCase() === filterDomain.toLowerCase()
      );
    }

    if (filterSkills.trim()) {
      filtered = filtered.filter((s) =>
        s.skills?.some((skill) =>
          skill.toLowerCase().includes(filterSkills.toLowerCase())
        )
      );
    }

    setFilteredStudents(filtered);
  }, [filterDomain, filterSkills, students]);

  const handleConfirmHire = async (student) => {
    if (!hrInfo || !hrInfo._id || !hrInfo.company) {
      toast.error("HR profile not found. Please re-login.");
      return;
    }

    try {
      const res = await apiClient.post("/api/hr/send-invite", {
        studentId: student._id,
        companyName: hrInfo.company,
        hrId: hrInfo._id,
      });

      if (res.data.success) {
        toast.success("Invitation sent successfully!");
        fetchInvitedStudents(); // refresh list
      } else {
        toast.error(res.data.message || "Failed to send invitation.");
      }
    } catch (err) {
      console.error("Error sending hire invitation:", err);
      toast.error("Error sending invite. Please try again later.");
    }
  };

  // Leaderboard logic (top 3 by calculated average progress)
  const leaderboard = useMemo(() => {
    return [...students]
      .filter((s) => s.calculatedProgress !== undefined)
      .sort((a, b) => (b.calculatedProgress || 0) - (a.calculatedProgress || 0))
      .slice(0, 3);
  }, [students]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-lg font-semibold">
        Loading...
      </div>
    );

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
              {i + 1}. {s.user?.name || "N/A"} ({s.calculatedProgress || 0}%)
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
    try {
      // When clicking "View Details", we already have the detailed data if the N+1 workaround is active.
      // Find the student from the `students` state to avoid another API call.
      const studentData = students.find((s) => s._id === studentId);

      if (studentData) {
        // If we already fetched detailed data, use it
        setStudentDetails({
          student: {
            ...studentData,
            course: studentData.detailedCourses, // Use the detailed courses
          },
          courseProgressMap: studentData.courseProgressMap,
        });
        // Fetch reports for this student to determine which courses have reports
        try {
          const repRes = await apiClient.get("/api/aiInterview/all-reports");
          const allReports = Array.isArray(repRes.data) ? repRes.data : [];
          // Normalize to strings for easy comparison
          setReports(
            allReports.map((r) => ({
              student: String(r.student),
              course: String(r.course),
            }))
          );
        } catch (e) {
          console.warn("Failed to fetch reports for HR modal", e);
          setReports([]);
        }
        setShowModal(true);
      } else {
        // Fallback: if for some reason data isn't in state, fetch it
        const res = await apiClient.get(`/api/hr/student-details/${studentId}`);
        setStudentDetails(res.data);
        // fetch reports for this student
        try {
          const repRes = await apiClient.get("/api/aiInterview/all-reports");
          const allReports = Array.isArray(repRes.data) ? repRes.data : [];
          setReports(
            allReports.map((r) => ({
              student: String(r.student),
              course: String(r.course),
            }))
          );
        } catch (e) {
          console.warn("Failed to fetch reports for HR modal", e);
          setReports([]);
        }
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
      toast.error("Failed to fetch student details.");
    }
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Domain Dropdown */}
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Domains</option>
            <option value="Technology and Innovation">
              Technology and Innovation
            </option>
            <option value="Healthcare and Wellness">
              Healthcare and Wellness
            </option>
            <option value="Business and Finance">Business and Finance</option>
            <option value="Arts and Creativity">Arts and Creativity</option>
            <option value="Education and Social Services">
              Education and Social Services
            </option>
          </select>

          {/* Skills Text Input */}
          <input
            type="text"
            placeholder="Filter by skills (e.g., React, Python)"
            value={filterSkills}
            onChange={(e) => setFilterSkills(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full relative">
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-800 text-xl"
                onClick={() => setShowLeaderboard(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
                <span role="img" aria-label="trophy" className="mr-2">
                  🏆
                </span>
                Leaderboard
              </h2>

              {/* Filters inside leaderboard */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={leaderboardDomain}
                  onChange={(e) => setLeaderboardDomain(e.target.value)}
                  className="border p-2 rounded w-full sm:w-1/2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Domains</option>
                  <option value="Technology and Innovation">
                    Technology and Innovation
                  </option>
                  <option value="Healthcare and Wellness">
                    Healthcare and Wellness
                  </option>
                  <option value="Business and Finance">
                    Business and Finance
                  </option>
                  <option value="Arts and Creativity">
                    Arts and Creativity
                  </option>
                  <option value="Education and Social Services">
                    Education and Social Services
                  </option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by skills"
                  value={leaderboardSkills}
                  onChange={(e) => setLeaderboardSkills(e.target.value)}
                  className="border p-2 rounded w-full sm:w-1/2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <ol className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {[...students]
                  .filter((s) => s.calculatedProgress !== undefined)
                  .filter((s) =>
                    leaderboardDomain
                      ? s.domain?.toLowerCase() ===
                        leaderboardDomain.toLowerCase()
                      : true
                  )
                  .filter((s) =>
                    leaderboardSkills
                      ? s.skills?.some((skill) =>
                          skill
                            .toLowerCase()
                            .includes(leaderboardSkills.toLowerCase())
                        )
                      : true
                  )
                  .sort(
                    (a, b) =>
                      (b.calculatedProgress || 0) - (a.calculatedProgress || 0)
                  )
                  .map((s, idx) => (
                    <li
                      key={s._id || idx}
                      onClick={() => handleStudentClick(s._id)}
                      className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`font-bold text-lg ${
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {s.user?.name || "N/A"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {s.college || "N/A"}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {s.calculatedProgress || 0}%
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
            No students found matching your criteria.
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
                {/* Display College, Roll No, College Course */}
                <div className="text-xs text-gray-500 text-center mb-1">
                  <strong>College:</strong> {student.college || "N/A"}
                </div>
                <div className="text-xs text-gray-500 text-center mb-1">
                  <strong>Roll No:</strong> {student.rollNumber || "N/A"}
                </div>
                <div className="text-xs text-gray-500 text-center mb-2">
                  <strong>College Course:</strong>{" "}
                  {student.collegecourse || "N/A"}
                </div>

                {/* Progress Bar based on calculatedAverageProgress */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ width: `${student.calculatedProgress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Progress: {student.calculatedProgress || 0}%
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
                  {studentDetails.student.course.length > 0 ? (
                    studentDetails.student.course.map((course) => (
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
                              width: `${Math.min(
                                Math.max(
                                  studentDetails.courseProgressMap[
                                    course._id
                                  ] || 0,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-right text-gray-500 mt-1">
                          {Math.min(
                            Math.max(
                              studentDetails.courseProgressMap[course._id] || 0,
                              0
                            ),
                            100
                          )}
                          % completed
                        </div>

                        {/* ✅ View Report Button only if progress is exactly 100% and a report exists */}
                        {Math.round(
                          studentDetails.courseProgressMap[course._id] || 0
                        ) === 100 &&
                          reports.some((r) => {
                            const studentUserId = String(
                              studentDetails.student.user?._id ||
                                studentDetails.student.user
                            );
                            return (
                              r.student === studentUserId &&
                              r.course === String(course._id)
                            );
                          }) && (
                            <div className="mt-3 flex justify-end">
                              <button
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                                onClick={() =>
                                  window.open(
                                    `/ai-interview-analysis/${course._id}?view=hr`,
                                    "_blank"
                                  )
                                }
                              >
                                View Report
                              </button>
                            </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No courses enrolled.</p>
                  )}
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
