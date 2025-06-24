import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [progressLevel, setProgressLevel] = useState("Beginner");
  const [learningProgress, setLearningProgress] = useState({
    courseTitle: "",
    progressPercent: 0,
    completedModules: 0,
    totalModules: 0,
    readinessPercent: null,
    readinessDetails: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const recRes = await axios.get(`/api/recommendations/${user.id || user._id}`);
        if (recRes.data.profile_analysis) {
          setProfile(recRes.data.profile_analysis);
          setRecommendedCourses(recRes.data.recommended_courses || []);
          setProgressLevel(recRes.data.profile_analysis.level || "Beginner");
          setShowAssessmentBtn(false);
        } else {
          setShowAssessmentBtn(true);
        }

        const enrolledRes = await axios.get(`/api/students/enrollments/${user.id || user._id}`);
        setEnrolledCourses(enrolledRes.data || []);

        const progressRes = await axios.get(`/api/students/progress/${user.id || user._id}`);
        let readinessPercent = progressRes.data.readinessPercent;
        let readinessDetails = progressRes.data.readinessDetails;

        if (!readinessDetails && recRes.data.profile_analysis) {
          const pa = recRes.data.profile_analysis;
          const confidence = Number(pa.confidenceScore || pa.confidence_score || 0);
          const communication = Number(pa.communicationClarity || pa.communication_clarity || 0);
          let toneScore = 0;
          const tone = (pa.tone || "").toLowerCase();
          if (tone === "confident" || tone === "passionate") toneScore = 10;
          else if (tone === "intermediate" || tone === "neutral") toneScore = 7;
          else if (tone === "hesitant") toneScore = 5;
          else if (tone === "unsure") toneScore = 3;

          const scores = [confidence, communication, toneScore].filter((v) => v > 0);
          if (scores.length > 0) {
            readinessPercent = Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) * 100);
          }

          readinessDetails = {
            confidenceScore: confidence,
            communicationClarity: communication,
            tone: pa.tone || "",
            toneScore,
          };
        }

        setLearningProgress({
          ...progressRes.data,
          readinessPercent,
          readinessDetails,
        });
      } catch (err) {
        console.error("Dashboard Load Error:", err.message);
        setShowAssessmentBtn(true);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchDashboardData();
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10 px-4 sm:px-8 max-w-6xl mx-auto">
        {showAssessmentBtn ? (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-6">Welcome, {user.name?.split(" ")[0]}</h1>
            <p className="mb-6 text-gray-600">To get started, please take your Career Assessment.</p>
            <button
              onClick={() => navigate("/student/assessments")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
            >
              Take Career Assessment <ArrowRight className="inline ml-1" />
            </button>
          </div>
        ) : (
          <>
            {/* Career Readiness Score */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Career Readiness Score</h2>
              <div className="bg-white rounded-xl p-4 shadow-md text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-700 mb-1">
                    {learningProgress.readinessPercent !== null
                      ? `${learningProgress.readinessPercent}%`
                      : progressLevel}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{
                        width: learningProgress.readinessPercent !== null
                          ? `${learningProgress.readinessPercent}%`
                          : progressLevel === "Beginner"
                            ? "30%"
                            : progressLevel === "Intermediate"
                              ? "60%"
                              : "90%",
                      }}
                    ></div>
                  </div>
                  {learningProgress.readinessDetails && (
                    <div className="text-xs text-gray-500 mt-1 flex flex-col items-center">
                      {learningProgress.readinessDetails.confidenceScore !== undefined && (
                        <span>Confidence: {learningProgress.readinessDetails.confidenceScore} / 10</span>
                      )}
                      {learningProgress.readinessDetails.communicationClarity !== undefined && (
                        <span>Communication: {learningProgress.readinessDetails.communicationClarity} / 10</span>
                      )}
                      {learningProgress.readinessDetails.tone && (
                        <span>Tone: {learningProgress.readinessDetails.tone}</span>
                      )}
                    </div>
                  )}
                  {learningProgress.readinessPercent !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      Based on your confidence, tone, and communication analysis
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Learning Path Progress */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">Your Learning Path</h2>
                <button
                  onClick={() => navigate("/student/learning-path")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Show Full Learning Path
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {learningProgress.courseTitle
                  ? `Course: ${learningProgress.courseTitle}`
                  : "Explore personalized modules based on your level."}
              </p>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Progress: {learningProgress.progressPercent || 0}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {learningProgress.completedModules || 0} of {learningProgress.totalModules || 0} modules completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ width: `${learningProgress.progressPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </section>

            {/* Enrolled Courses */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">Enrolled Courses</h2>
                <button
                  onClick={() => navigate("/student/courses")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All Courses
                </button>
              </div>
              {enrolledCourses.length === 0 ? (
                <p className="text-gray-500 italic">You have not enrolled in any courses yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course, idx) => (
                    <div key={course._id || idx} className="bg-white p-4 rounded-xl shadow-md">
                      <h3 className="text-lg font-bold text-blue-700 mb-1">{course.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Level:</span>{" "}
                        <span className="text-gray-900">{course.level}</span>
                      </div>
                      {course.skillsCovered && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-600">Skills:</span>{" "}
                          <span className="text-gray-900">
                            {Array.isArray(course.skillsCovered)
                              ? course.skillsCovered.join(", ")
                              : course.skillsCovered}
                          </span>
                        </div>
                      )}
                      {course.idealRoles && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-600">Ideal Roles:</span>{" "}
                          <span className="text-gray-900">
                            {Array.isArray(course.idealRoles)
                              ? course.idealRoles.join(", ")
                              : course.idealRoles}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Resume Course */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Resume Your Course</h2>
              <button
                onClick={() => navigate("/student/course/player")}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow hover:scale-105 transition"
              >
                Go to Learning
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
