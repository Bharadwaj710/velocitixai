import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [level, setLevel] = useState("Beginner");
  const [readinessPercent, setReadinessPercent] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = user.id || user._id;

        // 1. Check if career assessment is completed
        const assessmentRes = await axios.get(`/api/assessments/${userId}`);
        const assessmentExists =
          assessmentRes.data && Object.keys(assessmentRes.data).length > 0;

        // 2. Check if student details are filled
        const detailsRes = await axios.get(`/api/students/details/${userId}`);
        const progressRes = await axios.get(`/api/students/progress/${userId}`);

        const details = detailsRes.data;
        const hasFilledDetails =
          details?.rollNumber && details?.college && details?.collegecourse;

        if (assessmentExists && hasFilledDetails) {
          setShowAssessmentBtn(false);
          setReadinessPercent(progressRes.data.readinessPercent || 50);
          setLevel(progressRes.data.level || "Beginner");

          let courses = details.course || [];
          if (!Array.isArray(courses)) courses = courses ? [courses] : [];
          setEnrolledCourses(courses);
        } else {
          // Show old dashboard with "Take Assessment" button
          setShowAssessmentBtn(true);
        }
      } catch (err) {
        console.error("Dashboard load error:", err.message);
        setShowAssessmentBtn(true);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.id || user._id)) {
  fetchDashboardData();
}
  }, []);
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  // Minimal view before assessment
  if (showAssessmentBtn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {user.name?.split(" ")[0]}!
        </h1>
        <p className="mb-6 text-gray-600">
          To get started, please take your Career Assessment.
        </p>
        <button
          onClick={() => navigate("/student/assessments")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
        >
          Take Career Assessment <ArrowRight className="inline ml-1" />
        </button>
      </div>
    );
  }

  // Redesigned dashboard after assessment
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10 px-4 sm:px-8 max-w-5xl mx-auto space-y-10">
        {/* Welcome Back */}
        <section>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.name?.split(" ")[0]}!
          </h1>
        </section>

        {/* Career Readiness Score Card */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Career Readiness Score
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl shadow p-6 mb-2">
            <div className="text-gray-600 text-base mb-4 md:mb-0">
              Based on your assessment results.
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-bold text-blue-700">
                {readinessPercent != null ? `${readinessPercent}%` : level}
              </span>
              <span className="text-sm text-gray-500 mt-1">{level}</span>
            </div>
          </div>
        </section>

        {/* Learning Path Progress */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Learning Path Progress
            </h2>
            <button
              onClick={() => navigate("/student/learning-path")}
              className="text-sm text-blue-600 hover:underline"
            >
              View Learning Path
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <span className="text-gray-700 text-base">
                Proficiency Level:{" "}
                <span className="font-semibold">{level}</span>
              </span>
              <span className="text-gray-500 text-sm">
                (Progress tracking coming soon)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-700"
                style={{ width: `0%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* AI Suggestions */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            AI Suggestions
          </h2>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-gray-600 mb-4 md:mb-0">
              Based on your career assessment, we’ve selected recommended
              courses for you.
            </div>
            <button
              onClick={() => navigate("/student/courses")}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              View Suggested Courses
            </button>
          </div>
        </section>

        {/* Enrolled Courses */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Enrolled Courses
            </h2>
          </div>
          {enrolledCourses.length === 0 ? (
            <p className="text-gray-500 italic">
              You have not enrolled in any courses yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course, idx) => (
                <div
                  key={course._id || idx}
                  className="bg-white p-4 rounded-xl shadow-md flex flex-col h-full"
                >
                  <h3 className="text-lg font-bold text-blue-700 mb-1">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {course.description}
                  </p>
                  <div className="mt-auto">
                    <span className="font-medium text-gray-600">Level:</span>{" "}
                    <span className="text-gray-900">
                      {course.level || "Beginner"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
