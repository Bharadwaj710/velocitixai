import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState("Beginner");
  const [readinessPercent, setReadinessPercent] = useState(0); // Always 0 until mock interview is taken
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [recentCourse, setRecentCourse] = useState(null);
  const [lastFlatIdx, setLastFlatIdx] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = user.id || user._id;

        // 1. Check if career assessment is completed
        const assessmentRes = await apiClient.get(`/api/assessments/${userId}`);
        const assessmentExists =
          assessmentRes.data && Object.keys(assessmentRes.data).length > 0;

        // 2. Check if student details are filled
        const detailsRes = await apiClient.get(
          `/api/students/details/${userId}`
        );
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

        let recent = null;
        let progress = 0;
        let lastIdx = 0;
        if (courses.length > 0) {
          recent = courses[courses.length - 1];
          try {
            const progressRes = await apiClient.get(
              `/api/progress/${userId}/${recent._id}`
            );
            const courseRes = await apiClient.get(`/api/courses/${recent._id}`);
            // Count all lessons in all weeks
            const weeks = courseRes.data.weeks || [];
            let totalLessons = 0;
            let completedLessons = progressRes.data.completedLessons || [];
            let found = false;
            let flatIdx = 0;
            for (let w = 0; w < weeks.length; w++) {
              for (let m = 0; m < (weeks[w].modules || []).length; m++) {
                for (
                  let l = 0;
                  l < (weeks[w].modules[m].lessons || []).length;
                  l++
                ) {
                  totalLessons++;
                  const lesson = weeks[w].modules[m].lessons[l];
                  if (!found && !completedLessons.includes(lesson.title)) {
                    lastIdx = flatIdx;
                    found = true;
                  }
                  flatIdx++;
                }
              }
            }
            if (!found) lastIdx = 0; // If all completed, start from first
            const completed = Math.min(completedLessons.length, totalLessons);
            progress =
              totalLessons > 0
                ? Math.min(100, Math.round((completed / totalLessons) * 100))
                : 0;
          } catch {}
        }
        setProgressPercent(progress);
        setRecentCourse(recent);
        setLastFlatIdx(lastIdx);

        if (assessmentExists && hasFilledDetails) {
          setShowAssessmentBtn(false);
          setReadinessPercent(0); // Always 0 until mock interview is taken
          setEnrolledCourses(courses);
        } else {
          setShowAssessmentBtn(true);
        }
      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
        if (err.response && err.response.status === 401) {
          // Token expired or unauthorized - log the user out
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setShowAssessmentBtn(true);
        }
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome, {user.name?.split(" ")[0]}!
            </span>
            <br />
          </h1>
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gray-900">Kickstart Your Career Journey</span>
          </h3>

          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            To get started, please take your AI-powered Career Assessment and
            unlock personalized opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/student/assessments")}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>Take Career Assessment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get progress percent for a course (simulate for now)
  const getCourseProgress = (course) => {
    if (course && typeof progressPercent === "number") {
      return Math.min(100, progressPercent);
    }
    return 0;
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
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:from-blue-700 hover:to-purple-700 transition-all"
              style={{ boxShadow: "0 2px 8px 0 rgba(60,60,180,0.08)" }}
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
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-40 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            getCourseProgress(recentCourse)
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">
                      {Math.min(100, getCourseProgress(recentCourse))}%
                    </span>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    onClick={() => {
                      if (getCourseStatus(recentCourse) === "Get Started") {
                        navigate(`/course-player/${recentCourse._id}`);
                      } else if (getCourseStatus(recentCourse) === "Resume") {
                        // Resume from last incomplete lesson
                        navigate(`/course-player/${recentCourse._id}`, {
                          state: { flatIdx: lastFlatIdx },
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
                You have not started any courses yet.
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
