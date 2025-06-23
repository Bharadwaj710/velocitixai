import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StudentCourses = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const studentId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [studentDoc, setStudentDoc] = useState(null); // For checking if details are incomplete
  const [enrollLoading, setEnrollLoading] = useState("");
  const navigate = useNavigate();

  const fieldLabels = {
    domain: "Domain",
    level: "Proficiency Level",
    desiredRole: "Desired Career Role",
    preferredLearningStyle: "Preferred Learning Style",
    skills: "Skills",
    challenges: "Challenges",
  };

  // Fetch enrolled and recommended courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch recommended courses and profile analysis
        const recRes = await axios.get(`/api/recommendations/${studentId}`);
        setProfile(recRes.data.profile_analysis || null);
        setRecommendedCourses(recRes.data.recommended_courses || []);

        // Fetch enrolled courses and student doc
        const enrollRes = await axios.get(
          `/api/students/enrollments/${studentId}`
        );
        setEnrolledCourses(enrollRes.data || []);

        // Fetch student doc to check if details are incomplete
        const studentRes = await axios.get(
          `/api/students/details/${studentId}`
        );
        setStudentDoc(studentRes.data || null);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchCourses();
  }, [studentId]);

  // Helper: is course enrolled?
  const isEnrolled = (courseId) =>
    enrolledCourses.some((c) => (c._id || c) === courseId);

  // Helper: is student details incomplete (only user and course fields exist)
  const isStudentDetailsIncomplete = () => {
    if (!studentDoc || !studentDoc.user || !studentDoc.course) return false;
    // If only user and course fields exist (no rollNumber, college, etc.)
    const keys = Object.keys(studentDoc);
    const requiredFields = [
      "rollNumber",
      "collegecourse",
      "branch",
      "yearOfStudy",
      "college",
      "phoneNumber",
      "address",
    ];
    return requiredFields.every((f) => !studentDoc[f]);
  };

  // ENROLL
  const handleEnroll = async (course) => {
    setEnrollLoading(course._id);
    try {
      await axios.post("/api/students/enroll", {
        userId: studentId,
        courseId: course._id,
      });
      setEnrolledCourses((prev) => [...prev, course]);
      setRecommendedCourses((prev) =>
        prev.filter((c) => (c._id || c) !== course._id)
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to enroll. Please try again.");
    } finally {
      setEnrollLoading("");
    }
  };

  // UNENROLL
  const handleUnenroll = async (course) => {
    setEnrollLoading(course._id);
    try {
      await axios.post("/api/students/unenroll", {
        userId: studentId,
        courseId: course._id,
      });

      // Remove from enrolledCourses
      setEnrolledCourses((prev) =>
        prev.filter((c) => (c._id || c) !== course._id)
      );

      // Add back to recommendedCourses only if not already present
      setRecommendedCourses((prev) => {
        const alreadyExists = prev.some((c) => (c._id || c) === course._id);
        return alreadyExists ? prev : [...prev, course];
      });
    } catch (err) {
      alert(
        err.response?.data?.error || "Failed to unenroll. Please try again."
      );
    } finally {
      setEnrollLoading("");
    }
  };

  if (!studentId) {
    setError("User not found. Please log in again.");
    setLoading(false);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-10 px-2 sm:px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Column: Profile Analysis (was right) */}
        <div className="w-full md:w-1/4 flex-shrink-0 order-1 md:order-none">
          {profile && (
            <div className="sticky top-24 mb-8 p-6 bg-white rounded-2xl shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold mb-2 text-blue-600">
                Profile Analysis
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(profile).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium text-gray-700 capitalize">
                      {fieldLabels[key] || key}
                    </span>{" "}
                    <span className="text-gray-900">
                      {Array.isArray(value) ? value.join(", ") : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Right Column: Recommended + Enrolled (was left) */}
        <div className="w-full md:w-3/4 flex flex-col gap-8 order-0 md:order-1">
          {/* Recommended Courses */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Recommended Courses
            </h2>
            {recommendedCourses.length === 0 ? (
              <div className="text-gray-500 italic mb-4">
                No recommendations found. Try updating your assessment.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {recommendedCourses.map((course, idx) => (
                  <div
                    key={course._id || idx}
                    className="flex items-center bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl border border-blue-100 gap-6"
                  >
                    {/* Left: Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1 text-blue-700 truncate">
                        {course.title}
                      </h3>
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-1">
                        <span>
                          <span className="font-medium">Level:</span>{" "}
                          <span className="text-gray-900">{course.level}</span>
                        </span>
                        {course.skillsCovered && (
                          <span>
                            <span className="font-medium">Skills:</span>{" "}
                            <span className="text-gray-900">
                              {Array.isArray(course.skillsCovered)
                                ? course.skillsCovered.join(", ")
                                : course.skillsCovered}
                            </span>
                          </span>
                        )}
                        {course.idealRoles && (
                          <span>
                            <span className="font-medium">Ideal Roles:</span>{" "}
                            <span className="text-gray-900">
                              {Array.isArray(course.idealRoles)
                                ? course.idealRoles.join(", ")
                                : course.idealRoles}
                            </span>
                          </span>
                        )}
                      </div>
                      {course.modules &&
                        Array.isArray(course.modules) &&
                        course.modules.length > 0 && (
                          <div className="mt-1">
                            <span className="font-medium text-gray-600">
                              Modules:
                            </span>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {course.modules.map((mod, i) => (
                                <li key={mod.title || i} className="text-gray-800">
                                  <span className="font-semibold">{mod.title}</span>
                                  {mod.resources && mod.resources.length > 0 && (
                                    <>
                                      {": "}
                                      <a
                                        href={mod.resources[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-pink-500 transition-colors duration-200 ml-1"
                                      >
                                        {mod.resources[0].name || "View Resource"}
                                      </a>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                    {/* Right: Enroll Button */}
                    <div className="flex-shrink-0 flex flex-col items-end justify-center">
                      <button
                        onClick={() =>
                          isEnrolled(course._id)
                            ? handleUnenroll(course)
                            : handleEnroll(course)
                        }
                        disabled={enrollLoading === course._id}
                        className="py-2 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-700 transition-all duration-300 min-w-[120px]"
                      >
                        {enrollLoading === course._id
                          ? "Processing..."
                          : isEnrolled(course._id)
                          ? "Unenroll"
                          : "Enroll"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Enrolled Courses */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-green-700">
              Enrolled Courses
            </h2>
            {enrolledCourses.length === 0 ? (
              <div className="text-gray-500 italic mb-4">
                You have not enrolled in any courses yet.
              </div>
            ) : (
              <div className="flex flex-col gap-6 mb-2">
                {enrolledCourses.map((course, idx) => (
                  <div
                    key={course._id || idx}
                    className="flex items-center bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl border border-green-100 gap-6"
                  >
                    {/* Left: Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1 text-green-700 truncate">
                        {course.title}
                      </h3>
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-1">
                        <span>
                          <span className="font-medium">Level:</span>{" "}
                          <span className="text-gray-900">{course.level}</span>
                        </span>
                        {course.skillsCovered && (
                          <span>
                            <span className="font-medium">Skills:</span>{" "}
                            <span className="text-gray-900">
                              {Array.isArray(course.skillsCovered)
                                ? course.skillsCovered.join(", ")
                                : course.skillsCovered}
                            </span>
                          </span>
                        )}
                        {course.idealRoles && (
                          <span>
                            <span className="font-medium">Ideal Roles:</span>{" "}
                            <span className="text-gray-900">
                              {Array.isArray(course.idealRoles)
                                ? course.idealRoles.join(", ")
                                : course.idealRoles}
                            </span>
                          </span>
                        )}
                      </div>
                      {course.modules &&
                        Array.isArray(course.modules) &&
                        course.modules.length > 0 && (
                          <div className="mt-1">
                            <span className="font-medium text-gray-600">
                              Modules:
                            </span>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {course.modules.map((mod, i) => (
                                <li key={mod.title || i} className="text-gray-800">
                                  <span className="font-semibold">{mod.title}</span>
                                  {mod.resources && mod.resources.length > 0 && (
                                    <>
                                      {": "}
                                      <a
                                        href={mod.resources[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-pink-500 transition-colors duration-200 ml-1"
                                      >
                                        {mod.resources[0].name || "View Resource"}
                                      </a>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                    {/* Right: Unenroll Button */}
                    <div className="flex-shrink-0 flex flex-col items-end justify-center">
                      <button
                        onClick={() => handleUnenroll(course)}
                        disabled={enrollLoading === course._id}
                        className="py-2 px-6 rounded-lg bg-gradient-to-r from-red-400 to-pink-500 text-white font-semibold shadow hover:from-red-500 hover:to-pink-600 transition-all duration-300 min-w-[120px]"
                      >
                        {enrollLoading === course._id ? "Processing..." : "Unenroll"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Complete Details Button */}
            {enrolledCourses.length > 0 && isStudentDetailsIncomplete() && (
              <div className="flex flex-col items-end mt-6">
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-3">
                  <span className="text-gray-700 font-medium">
                    To continue please complete your
                  </span>
                  <button
                    onClick={() => navigate("/student/details")}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Student details
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;
