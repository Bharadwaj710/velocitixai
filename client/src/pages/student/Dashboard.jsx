import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState("Beginner");
  const [readinessPercent, setReadinessPercent] = useState(0); // Always 0 until mock interview is taken
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentCourse, setRecentCourse] = useState(null);

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
        const details = detailsRes.data;
        const hasFilledDetails =
          details?.rollNumber && details?.college && details?.collegecourse;

        // 3. Fetch proficiency level from backend (from corrected_level in assessment)
        let correctedLevel = "Beginner";
        if (assessmentRes.data && assessmentRes.data.corrected_level) {
          correctedLevel = assessmentRes.data.corrected_level;
        }
        setProficiencyLevel(correctedLevel);

        let courses = details.course || [];
        if (!Array.isArray(courses)) courses = courses ? [courses] : [];

        // Simulate "recently watched" logic: pick the last course in the array
        let recent = null;
        if (courses.length > 0) {
          recent = courses[courses.length - 1];
        }

        if (assessmentExists && hasFilledDetails) {
          setShowAssessmentBtn(false);
          setReadinessPercent(0); // Always 0 until mock interview is taken
          setEnrolledCourses(courses);
          setRecentCourse(recent);
        } else {
          setShowAssessmentBtn(true);
        }
      } catch (err) {
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

  // Helper to get progress percent for a course (simulate for now)
  const getCourseProgress = (course) => {
    if (course && typeof course.progressPercent === "number") {
      return course.progressPercent;
    }
    return course && course.started ? 50 : 0;
  };

  const getCourseStatus = (course) => {
    const progress = getCourseProgress(course);
    return progress > 0 ? "Resume" : "Get Started";
  };

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
              {/* Info about readiness score */}
              This score will be available after you take a mock interview.
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-bold text-blue-700">
                {readinessPercent}%
              </span>
              <span className="text-sm text-gray-500 mt-1">
                Proficiency Level: {proficiencyLevel}
              </span>
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
              onClick={() => navigate("/student/my-learning")}
              className="text-sm text-blue-600 hover:underline font-semibold"
            >
              My Learning
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            {recentCourse ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3
                    className="text-lg font-bold text-blue-700 mb-1 cursor-pointer hover:underline"
                    onClick={() =>
                      navigate("/student/learning-path", {
                        state: { courseId: recentCourse._id },
                      })
                    }
                  >
                    {recentCourse.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {recentCourse.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-600">Level:</span>
                    <span className="text-gray-900">
                      {recentCourse.level || "Beginner"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="w-40 bg-gray-200 rounded-full h-2.5 mb-1">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                      style={{ width: `${getCourseProgress(recentCourse)}%` }}
                    ></div>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    onClick={() => {
                      if (
                        getCourseStatus(recentCourse) === "Get Started" ||
                        getCourseStatus(recentCourse) === "Resume"
                      ) {
                        navigate("/student/CoursePlayer", {
                          state: { courseId: recentCourse._id },
                        });
                      }
                    }}
                  >
                    {getCourseStatus(recentCourse)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">
                You have not enrolled in any courses yet.
              </div>
            )}
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
      </main>
    </div>
  );
};

export default StudentDashboard;
