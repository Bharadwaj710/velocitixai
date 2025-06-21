import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const CourseRecommendations = () => {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/api/recommendations/${studentId}`);
        setProfile(res.data.profile_analysis || null);
        setCourses(res.data.recommended_courses || []);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch recommendations."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [studentId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-blue-700">
          Course Recommendations
        </h1>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center font-semibold py-8">{error}</div>
        ) : (
          <>
            {profile && (
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg transition-all duration-300">
                <h2 className="text-xl font-semibold mb-2 text-blue-600">Profile Analysis</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(profile).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{" "}
                      <span className="text-gray-900">{Array.isArray(value) ? value.join(", ") : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {courses.length === 0 ? (
              <div className="text-center text-gray-600 text-lg py-12">
                No recommendations found.<br />
                <span className="text-sm text-gray-400">Try updating your assessment.</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, idx) => (
                  <div
                    key={course._id || idx}
                    className="bg-white rounded-2xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-xl border border-blue-100"
                  >
                    <h3 className="text-xl font-bold mb-2 text-blue-700">
                      {course.title}
                    </h3>
                    <p className="text-gray-700 mb-3 line-clamp-3">{course.description}</p>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Level:</span>{" "}
                      <span className="text-gray-900">{course.level}</span>
                    </div>
                    {course.skillsCovered && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Skills:</span>{" "}
                        <span className="text-gray-900">{Array.isArray(course.skillsCovered) ? course.skillsCovered.join(", ") : course.skillsCovered}</span>
                      </div>
                    )}
                    {course.idealRoles && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Ideal Roles:</span>{" "}
                        <span className="text-gray-900">{Array.isArray(course.idealRoles) ? course.idealRoles.join(", ") : course.idealRoles}</span>
                      </div>
                    )}
                    {course.modules && Array.isArray(course.modules) && course.modules.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Modules:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {course.modules.map((mod, i) => (
                            <li key={mod.title || i} className="text-gray-800">
                              <span className="font-semibold">{mod.title}</span>
                              {mod.resource && (
                                <>
                                  {": "}
                                  <a
                                    href={mod.resource}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-pink-500 transition-colors duration-200 ml-1"
                                  >
                                    Resource
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
          </>
        )}
      </div>
    </div>
  );
};

export default CourseRecommendations;
