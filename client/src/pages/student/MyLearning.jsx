import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyLearning = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        const detailsRes = await axios.get(`/api/students/details/${userId}`);
        let courses = detailsRes.data.course || [];
        if (!Array.isArray(courses)) courses = courses ? [courses] : [];
        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          courses.map(async (course) => {
            try {
              const progressRes = await axios.get(
                `/api/progress/${userId}/${course._id}`
              );
              const courseRes = await axios.get(`/api/courses/${course._id}`);
              const weeks = courseRes.data.weeks || [];
              let totalLessons = 0;
              let completedLessons = progressRes.data.completedLessons || [];
              let found = false;
              let flatIdx = 0;
              let lastFlatIdx = 0;
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
                      lastFlatIdx = flatIdx;
                      found = true;
                    }
                    flatIdx++;
                  }
                }
              }
              if (!found) lastFlatIdx = 0; // If all completed, start from first
              const completed = Math.min(completedLessons.length, totalLessons);
              const progressPercent =
                totalLessons > 0
                  ? Math.min(100, Math.round((completed / totalLessons) * 100))
                  : 0;
              return { ...course, progressPercent, lastFlatIdx };
            } catch {
              return { ...course, progressPercent: 0, lastFlatIdx: 0 };
            }
          })
        );
        // Fetch interview session status for each course (if AI Interview enabled)
        const token = localStorage.getItem("token");
        const coursesWithStatus = await Promise.all(
          coursesWithProgress.map(async (c) => {
            try {
              // Only query if course supports AI interview (property present)
              if (!c.aiInterviewEnabled) return { ...c, interviewStatus: null };
              const opts = token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : {};
              const res = await axios.get(
                `/api/aiInterview/session/${userId}/${c._id}`,
                opts
              );
              return { ...c, interviewStatus: res.data.status || null };
            } catch (err) {
              // on any error, don't block—set null status
              return { ...c, interviewStatus: null };
            }
          })
        );

        setEnrolledCourses(coursesWithStatus);
      } catch (err) {
        console.error("Failed to load enrolled courses:", err);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolled();
  }, [userId]);

  const getCourseProgress = (course) => {
    if (course && typeof course.progressPercent === "number") {
      return Math.min(100, course.progressPercent);
    }
    return course && course.started ? Math.min(50, 100) : 0; // placeholder logic
  };

  const getCourseStatus = (course) => {
    const progress = getCourseProgress(course);
    return progress > 0 ? "Resume" : "Get Started";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Learning</h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          Loading your courses...
        </div>
      ) : enrolledCourses.length === 0 ? (
        <div className="text-gray-500 italic">
          You have not enrolled in any courses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, idx) => (
            <div
              key={course._id || idx}
              className="bg-white p-6 rounded-xl shadow-md flex flex-col h-full"
            >
              <h3
                className="text-lg font-bold text-blue-700 mb-1 cursor-pointer hover:underline"
                onClick={() =>
                  navigate("/student/learning-path", {
                    state: { courseId: course._id },
                  })
                }
              >
                {course.title}
              </h3>

              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {course.description}
              </p>

              <div className="mb-2">
                <span className="font-medium text-gray-600">Level:</span>{" "}
                <span className="text-gray-900">
                  {course.level || "Beginner"}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                  style={{
                    width: `${Math.min(100, getCourseProgress(course))}%`,
                  }}
                ></div>
              </div>

              {/* Main Course Action Button */}
              <button
                className={`mt-auto px-5 py-2 rounded-lg shadow font-semibold transition ${
                  getCourseProgress(course) === 100
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={() =>
                  navigate(`/course-player/${course._id}`, {
                    state: {
                      flatIdx:
                        getCourseProgress(course) === 100
                          ? 0 // restart from start after completion
                          : course.lastFlatIdx,
                    },
                  })
                }
              >
                {getCourseProgress(course) === 100
                  ? "Go to Course"
                  : getCourseProgress(course) > 0
                  ? "Resume"
                  : "Get Started"}
              </button>

              {/* AI Interview Button */}
              {course.aiInterviewEnabled &&
                getCourseProgress(course) === 100 &&
                (course.interviewStatus === "completed" ||
                course.interviewStatus === "terminated" ? (
                  <button
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                    onClick={() =>
                      navigate(`/ai-interview-analysis/${course._id}`)
                    }
                  >
                    View Analysis
                  </button>
                ) : (
                  <button
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    onClick={() =>
                      navigate(
                        `/ai-interview-instructions?courseId=${course._id}`
                      )
                    }
                  >
                    Start AI Interview
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLearning;
