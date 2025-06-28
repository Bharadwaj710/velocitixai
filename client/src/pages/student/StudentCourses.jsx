import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing your responses with our AI engine... 🧠",
    "Extracting key skills from your answers... ✍️",
    "Matching your interests to relevant domains... 🔍",
    "Scanning your video for communication cues... 🎥",
    "Finding the best YouTube courses for you... 📚",
    "Running a few AI models in the background... 🤖",
    "Summarizing your profile insights... 📊",
    "Almost there... Just fine-tuning the results! 🛠️",
    "Thank you for being patient. Smart things take time! ⏳",
  ];
  const [isProcessed, setIsProcessed] = useState(true); // assume processed by default
  const [refreshing, setRefreshing] = useState(false);
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
  const fetchCourses = async (forceRefresh = false) => {
    setLoading(true);
    setError("");
    try {
      // Fetch recommended courses and profile analysis
      const recRes = await axios.get(
        `/api/recommendations/${studentId}${forceRefresh ? "?refresh=1" : ""}`
      );
      setProfile(recRes.data.profile_analysis || null);

      // Always fetch enrolled courses and merge with recommendations
      const enrollRes = await axios.get(
        `/api/students/enrollments/${studentId}`
      );
      const enrolled = enrollRes.data || [];
      setEnrolledCourses(enrolled);

      // Merge: show all recommended + all enrolled (no duplicates)
      const recommended = recRes.data.recommended_courses || [];
      // Add enrolled courses not present in recommended
      const recommendedIds = new Set(recommended.map(c => (c._id || c)));
      const mergedCourses = [
        ...recommended,
        ...enrolled.filter(c => !recommendedIds.has(c._id || c))
      ];
      setRecommendedCourses(mergedCourses);

      setIsProcessed(recRes.data.isProcessed !== false);

      // Fetch student doc to check if details are incomplete
      const studentRes = await axios.get(
        `/api/students/details/${studentId}`
      );
      setStudentDoc(studentRes.data || null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch courses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchCourses();
    // eslint-disable-next-line
  }, [studentId]);

  useEffect(() => {
    if (!loading) return; // only rotate messages while loading
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [loading]);

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

  // Helper: does student details exist (for modal logic)
  const studentExists = !!(
    studentDoc &&
    studentDoc.user &&
    [
      "rollNumber",
      "collegecourse",
      "branch",
      "yearOfStudy",
      "college",
      "phoneNumber",
      "address",
    ].every(
      (field) => studentDoc[field] && studentDoc[field].toString().trim() !== ""
    )
  );

  // ENROLL
  const handleEnroll = async (course) => {
    setEnrollLoading(course._id);
    try {
      await axios.post("/api/students/enroll", {
        userId: studentId,
        courseId: course._id,
      });

      // ✅ Add to enrolledCourses if not already present
      setEnrolledCourses((prev) => {
        const exists = prev.some((c) => (c._id || c) === course._id);
        return exists ? prev : [...prev, course];
      });
      // ✅ Show modal if student details are not filled
      if (!studentExists) {
        setShowDetailsModal(true);
      }
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

  // Refresh recommendations handler
  const handleRefreshRecommendations = async () => {
    setRefreshing(true);
    await fetchCourses(true);
  };

  if (!studentId) {
    setError("User not found. Please log in again.");
    setLoading(false);
    return null;
  }

  if (loading || refreshing) {
    // Video still processing: show fun rotating messages + spinner
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white  text-gray-700  px-4 text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50 mb-6"></div>

        {/* Rotating message */}
        <div className="text-xl md:text-2xl font-semibold animate-pulse">
          {loadingMessages[loadingMessageIndex]}
        </div>

        {/* Static fallback */}
        <div className="text-sm text-gray-500  mt-4">
          If this takes long, please come back in 2–3 minutes.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-10 px-2 sm:px-4 md:px-8">
      {/* Modal for student details completion */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2 text-gray-800 text-center">
              Please complete your student details to proceed.
            </h3>
            <button
              onClick={() => {
                setShowDetailsModal(false);
                navigate("/student/details");
              }}
              className="mt-4 flex items-center gap-2 py-2 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Student Details <span className="ml-1">→</span>
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Column: Profile Analysis (unchanged) */}
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
        {/* Right Column: Recommended Courses only */}
        <div className="w-full md:w-3/4 flex flex-col gap-8 order-0 md:order-1">
          {/* Recommended Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue-700">
                Recommended Courses
              </h2>
              <button
                onClick={handleRefreshRecommendations}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition disabled:opacity-60"
                title="Refresh Recommendations"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
            {recommendedCourses.length === 0 ? (
              <div className="text-gray-500 italic mb-4">
                No recommendations found. Try updating your assessment.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {recommendedCourses.map((course, idx) => {
                  const enrolled = isEnrolled(course._id);
                  return (
                    <div
                      key={course._id || idx}
                      className={`flex items-center bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl border gap-6 ${
                        enrolled ? "border-green-200" : "border-blue-100"
                      }`}
                    >
                      {/* Left: Details */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-lg font-bold mb-1 truncate transition-all duration-300 ${
                            enrolled ? "text-green-700" : "text-blue-700"
                          }`}
                        >
                          {course.title}
                        </h3>
                        {/* --- Show match score and label --- */}
                        <div className="flex items-center gap-3 mb-1">
                          {/* Remove % from match score */}
                          {typeof course.match_score === "number" && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Match: {course.match_score}
                            </span>
                          )}
                          {course.recommendation_label && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded
                              ${
                                course.recommendation_label === "Highly Recommended"
                                  ? "bg-green-100 text-green-700"
                                  : course.recommendation_label === "Recommended"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            `}>
                              {course.recommendation_label}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-1">
                          <span>
                            <span className="font-medium">Level:</span>{" "}
                            <span className="text-gray-900">
                              {course.level}
                            </span>
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
                                  <li
                                    key={mod.title || i}
                                    className="text-gray-800"
                                  >
                                    <span className="font-semibold">
                                      {mod.title}
                                    </span>
                                    {mod.resources &&
                                      mod.resources.length > 0 && (
                                        <>
                                          {": "}
                                          <a
                                            href={mod.resources[0].url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline hover:text-pink-500 transition-colors duration-200 ml-1"
                                          >
                                            {mod.resources[0].name ||
                                              "View Resource"}
                                          </a>
                                        </>
                                      )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                      {/* Right: Enroll/Unenroll Button */}
                      <div className="flex-shrink-0 flex flex-col items-end justify-center">
                        {enrolled ? (
                          <button
                            onClick={() => handleUnenroll(course)}
                            disabled={enrollLoading === course._id}
                            className="py-2 px-6 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold shadow hover:from-pink-600 hover:to-pink-700 transition-all duration-300 min-w-[120px]"
                          >
                            {enrollLoading === course._id
                              ? "Processing..."
                              : "Unenroll"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course)}
                            disabled={enrollLoading === course._id}
                            className="py-2 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-800 transition-all duration-300 min-w-[120px]"
                          >
                            {enrollLoading === course._id
                              ? "Processing..."
                              : "Enroll"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;
