import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const MODULE_TYPE_ICON = {
  Reading: "📖",
  Lab: "🧪",
  Assignment: "📝",
  Survey: "🗒️",
  Quiz: "❓",
};

const LearningPath = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);

  // Get courseId from navigation state (from dashboard/my-learning)
  const courseId = location.state?.courseId;

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        // Fix: Use correct endpoint for single course by ID
        // Your backend route is: /api/courses/:id
        const res = await axios.get(`/api/courses/${courseId}`);
        // Defensive: handle array response (if backend returns array for single course)
        const courseData = Array.isArray(res.data) ? res.data[0] : res.data;
        setCourse(courseData);
        setModules(courseData?.modules || []);
      } catch (err) {
        setCourse(null);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  // Simulate module progress (replace with real progress from DB if available)
  const getModuleStatus = (modIdx) => {
    // For now, first module is "Resume", others are "Get Started"
    if (modIdx === 0) return "Resume";
    return "Get Started";
  };

  const getModuleType = (module) => {
    // If you want to add type in your schema, use module.type, else fallback to "Reading"
    return module?.type || "Reading";
  };

  const getModuleTime = (module) => {
    // If you want to add estimatedTime in your schema, use module.estimatedTime, else fallback to "N/A"
    return module?.estimatedTime || "N/A";
  };

  const getModuleCompletion = (module) => {
    // If you want to add completed in your schema, use module.completed, else fallback to false
    return module?.completed ? "Completed" : "Not Started";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading course modules...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar: Course & Modules */}
      <aside className="w-full md:w-80 bg-white border-r shadow-sm flex-shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
              {course.title?.[0] || "C"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
              <div className="text-xs text-gray-500">{course.provider || "Velocitix AI"}</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="font-semibold text-gray-700 mb-2">Project Material</div>
          <ul className="space-y-1">
            {modules.map((mod, idx) => (
              <li
                key={mod._id || idx}
                className={`flex items-center px-3 py-2 rounded cursor-pointer transition-colors ${
                  idx === activeModuleIdx
                    ? "bg-blue-50 border-l-4 border-blue-600"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveModuleIdx(idx)}
              >
                <span className="mr-2 text-lg">
                  {MODULE_TYPE_ICON[getModuleType(mod)] || "📄"}
                </span>
                <span className="truncate">{mod.title || `Module ${idx + 1}`}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2">
            <div className="font-semibold text-gray-700">Grades</div>
            <div className="font-semibold text-gray-700">Notes</div>
            <div className="font-semibold text-gray-700">Discussion Forums</div>
            <div className="font-semibold text-gray-700">Messages</div>
            <div className="font-semibold text-gray-700">Project Info</div>
          </div>
        </div>
      </aside>
      {/* Main Content: Module Details */}
      <main className="flex-1 flex flex-col items-center justify-start p-8">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-blue-700">
              {modules[activeModuleIdx]?.title || "Module"}
            </h3>
            <span className="text-sm text-gray-500">
              {getModuleType(modules[activeModuleIdx])}
            </span>
          </div>
          <div className="mb-4 text-gray-700">
            {modules[activeModuleIdx]?.content ||
              modules[activeModuleIdx]?.description ||
              "No description available for this module."}
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⏱️</span>
              <span>
                {getModuleTime(modules[activeModuleIdx])} min
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📊</span>
              <span>
                Status: {getModuleCompletion(modules[activeModuleIdx])}
              </span>
            </div>
          </div>
          {/* Resources */}
          {modules[activeModuleIdx]?.resources && modules[activeModuleIdx].resources.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-1">Resources:</div>
              <ul className="list-disc list-inside space-y-1">
                {modules[activeModuleIdx].resources.map((res, i) => (
                  <li key={res.url || i}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-pink-500 transition-colors duration-200"
                    >
                      {res.name || "Resource"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Lessons */}
          {modules[activeModuleIdx]?.lessons && modules[activeModuleIdx].lessons.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-1">Lessons:</div>
              <ul className="list-disc list-inside space-y-1">
                {modules[activeModuleIdx].lessons.map((lesson, i) => (
                  <li key={lesson.videoUrl || i}>
                    <span className="font-medium">{lesson.title}</span>
                    {lesson.timestamp && (
                      <span className="text-xs text-gray-500 ml-2">({lesson.timestamp})</span>
                    )}
                    {lesson.videoUrl && (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-xs ml-2"
                      >
                        Watch
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() =>
              navigate("/student/CoursePlayer", {
                state: {
                  courseId: course._id,
                  moduleIdx: activeModuleIdx,
                  moduleId: modules[activeModuleIdx]?._id,
                },
              })
            }
          >
            {getModuleStatus(activeModuleIdx)}
          </button>
        </div>
      </main>
    </div>
  );
};

export default LearningPath;
