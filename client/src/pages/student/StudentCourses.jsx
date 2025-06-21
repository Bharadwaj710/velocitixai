import React, { useEffect, useState } from "react";
import axios from "axios";

const StudentCourses = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const studentId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const fieldLabels = {
    domain: "Domain",
    level: "Proficiency Level",
    desiredRole: "Desired Career Role",
    preferredLearningStyle: "Preferred Learning Style",
    skills: "Skills",
    challenges: "Challenges",
  };
  
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch recommended courses and profile analysis
        const recRes = await axios.get(`/api/recommendations/${studentId}`);
        setProfile(recRes.data.profile_analysis || null);
        setRecommendedCourses(recRes.data.recommended_courses || []);
        // Fetch enrolled courses (replace with your actual API if needed)
        // For now, keep empty by default
        setEnrolledCourses([]);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch courses."
        );
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchCourses();
  }, [studentId]);
    
  if (!studentId) {
    setError("User not found. Please log in again.");
    setLoading(false);
    return;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-blue-700">
          My Courses
        </h1>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center font-semibold py-8">
            {error}
          </div>
        ) : (
          <>
            {/* Enrolled Courses */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-2 text-green-700">
                Enrolled Courses
              </h2>
              {enrolledCourses.length === 0 ? (
                <div className="text-gray-500 italic mb-4">
                  You have not enrolled in any courses yet.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {enrolledCourses.map((course, idx) => (
                    <div
                      key={course._id || idx}
                      className="bg-white rounded-2xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-xl border border-green-100"
                    >
                      <h3 className="text-lg font-bold mb-1 text-green-700">
                        {course.title}
                      </h3>
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      {/* Add more enrolled course details as needed */}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Profile Analysis */}
            {profile && (
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg transition-all duration-300">
                <h2 className="text-xl font-semibold mb-2 text-blue-600">
                  Profile Analysis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {/* Recommended Courses */}
            <div>
              <h2 className="text-xl font-semibold mb-2 text-blue-700">
                Recommended Courses
              </h2>
              {recommendedCourses.length === 0 ? (
                <div className="text-gray-500 italic mb-4">
                  No recommendations found. Try updating your assessment.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommendedCourses.map((course, idx) => (
                    <div
                      key={course._id || idx}
                      className="bg-white rounded-2xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-xl border border-blue-100"
                    >
                      <h3 className="text-xl font-bold mb-2 text-blue-700">
                        {course.title}
                      </h3>
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {course.description}
                      </p>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">
                          Level:
                        </span>{" "}
                        <span className="text-gray-900">{course.level}</span>
                      </div>
                      {course.skillsCovered && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-600">
                            Skills:
                          </span>{" "}
                          <span className="text-gray-900">
                            {Array.isArray(course.skillsCovered)
                              ? course.skillsCovered.join(", ")
                              : course.skillsCovered}
                          </span>
                        </div>
                      )}
                      {course.idealRoles && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-600">
                            Ideal Roles:
                          </span>{" "}
                          <span className="text-gray-900">
                            {Array.isArray(course.idealRoles)
                              ? course.idealRoles.join(", ")
                              : course.idealRoles}
                          </span>
                        </div>
                      )}
                      {course.modules &&
                        Array.isArray(course.modules) &&
                        course.modules.length > 0 && (
                          <div className="mt-2">
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
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
