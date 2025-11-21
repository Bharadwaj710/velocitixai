import React, { useRef, useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";

const StudentCourses = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const studentId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  // previousCourses will store the IDs of courses from the last successful fetch
  // This is crucial for detecting *newly added* recommendations.
  const [previousCourses, setPreviousCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [studentDoc, setStudentDoc] = useState(null); // For checking if details are incomplete
  const [enrollLoading, setEnrollLoading] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { addNotification, notifications, removeNotification } =
    useNotification();
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

  const courseRefs = useRef({});
  const location = useLocation();

  const fieldLabels = {
    domain: "Domain",
    level: "Proficiency Level",
    desiredRole: "Desired Career Role",
    preferredLearningStyle: "Preferred Learning Style",
    skills: "Skills",
    challenges: "Challenges",
  };

  const removeNotificationByCourseId = async (courseId) => {
    try {
      await apiClient.delete(
        `/api/notifications/remove/${studentId}/${courseId}`
      );
      // No need to update context as your navbar fetches directly from backend on mount
    } catch (err) {
      console.error("Error removing notification", err);
    }
  };

  useEffect(() => {
    if (showDetailsModal) {
      const timeout = setTimeout(() => {
        navigate("/student/details");
      }, 5000); // 5 seconds

      return () => clearTimeout(timeout); // Cleanup if component unmounts or modal closes
    }
  }, [showDetailsModal, navigate]); // Added navigate to dependency array

  // Fetch enrolled and recommended courses
  // The `triggerNotifications` flag determines if new course notifications should be sent.
  // It's true for manual refresh, but false for initial load.
  const fetchCourses = async (triggerNotifications = false) => {
    setLoading(true);
    setError("");
    try {
      // Fetch current recommendations
      const recRes = await apiClient.get(
        `/api/recommendations/${studentId}${
          triggerNotifications ? "?refresh=1" : ""
        }`
      );
      setProfile(recRes.data.profile_analysis || null);

      // Fetch currently enrolled courses
      const enrollRes = await apiClient.get(
        `/api/students/enrollments/${studentId}`
      );
      const enrolled = enrollRes.data || [];
      setEnrolledCourses(enrolled);

      const currentRecommended = recRes.data.recommended_courses || [];

      // --- New Course Detection Logic ---
      // Only send notifications if `triggerNotifications` is true AND
      // if `previousCourses` is not empty (meaning it's not the very first load)
      if (triggerNotifications && previousCourses.length > 0) {
        const previousCourseIds = new Set(
          previousCourses.map((c) => c._id || c)
        );

        // Filter for courses that are in the current recommended list but NOT in the previous list
        const newCourses = currentRecommended.filter(
          (course) => !previousCourseIds.has(course._id || course)
        );

        if (newCourses.length > 0) {
          newCourses.forEach(async (course) => {
            try {
              // Send notification for each genuinely new course
              await apiClient.post("/api/notifications", {
                type: "new_course",
                message: `New course added: ${course.title}`,
                userId: studentId,
                meta: { courseId: course._id, link: "/student/courses" },
              });
            } catch (err) {
              console.error("Error adding notification for new course:", err);
            }
          });
        }
      }
      // --- End New Course Detection Logic ---

      // Merge enrolled and recommended courses for display
      const recommendedIds = new Set(currentRecommended.map((c) => c._id || c));
      const mergedCourses = [
        ...currentRecommended,
        ...enrolled.filter((c) => !recommendedIds.has(c._id || c)),
      ];

      setRecommendedCourses(mergedCourses);

      // ALWAYS update previousCourses with the current recommended list
      // This sets the baseline for the next comparison.
      setPreviousCourses(currentRecommended);

      setIsProcessed(recRes.data.isProcessed !== false);

      const studentRes = await apiClient.get(
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

  // Initial fetch on component mount or studentId change (e.g., re-login)
  useEffect(() => {
    if (studentId) {
      // On initial load/re-login, we fetch courses but DO NOT trigger notifications.
      // The `previousCourses` state will be populated for future comparisons.
      fetchCourses(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]); // Only re-run if studentId changes

  useEffect(() => {
    if (!loading) return; // only rotate messages while loading
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]); // Added loadingMessages.length to dependencies

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

  useEffect(() => {
    if (location.state && location.state.courseId) {
      const courseElement = courseRefs.current[location.state.courseId];

      if (courseElement) {
        setTimeout(() => {
          courseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // ✅ Add Tailwind highlight class
          courseElement.classList.add(
            "ring-4",
            "ring-blue-400",
            "transition",
            "duration-300"
          );

          // ✅ Remove highlight after 2 seconds
          setTimeout(() => {
            courseElement.classList.remove(
              "ring-4",
              "ring-blue-400",
              "transition",
              "duration-300"
            );
          }, 2000);
        }, 200);

        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, recommendedCourses]);

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
      await apiClient.post("/api/students/enroll", {
        userId: studentId,
        courseId: course._id,
      });

      // ✅ Add to enrolledCourses if not already present
      setEnrolledCourses((prev) => {
        const exists = prev.some((c) => (c._id || c) === course._id);
        return exists ? prev : [...prev, course];
      });

      // ✅ Automatically remove the related notification
      removeNotificationByCourseId(course._id);

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
      await apiClient.post("/api/students/unenroll", {
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
    // Manual refresh always triggers new course detection and notifications
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
            <h3 className="text-lg font-bold mb-3 text-gray-800 text-center">
              Please complete your student details to proceed.
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              You will be redirected in 5 seconds...
            </p>
            <div className="animate-pulse text-blue-600 font-medium">
              Redirecting...
            </div>
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
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Click here to fetch latest courses
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
                      ref={(el) => (courseRefs.current[course._id] = el)}
                      className={`flex items-center bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl border gap-6 ${
                        enrolled ? "border-green-200" : "border-blue-100"
                      }`}
                    >
                      {/* Left: Details */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-lg font-bold mb-1 truncate transition-all duration-300 ${
                            enrolled ? "text-green-700" : "text-blue-700"
                          } cursor `}
                          // Removed onClick for learning path
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
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded
                              ${
                                course.recommendation_label ===
                                "Highly Recommended"
                                  ? "bg-green-100 text-green-700"
                                  : course.recommendation_label ===
                                    "Recommended"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            `}
                            >
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
                        <button
                          onClick={() => {
                            if (enrolled) {
                              handleUnenroll(course);
                            } else {
                              handleEnroll(course);
                            }
                          }}
                          disabled={enrollLoading === course._id}
                          className={`py-2 px-6 rounded-lg font-semibold shadow min-w-[120px] ${
                            enrolled
                              ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
                              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                          } transition-all duration-300`}
                        >
                          {enrollLoading === course._id
                            ? "Processing..."
                            : enrolled
                            ? "Unenroll"
                            : "Enroll"}
                        </button>
                        {/* Removed Resume/Get Started button */}
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
