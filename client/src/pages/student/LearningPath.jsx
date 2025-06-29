import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Circle, Info, BookOpen, FileText } from "lucide-react";

const SIDEBAR_SECTIONS = [
  { key: "modules", label: "Modules", icon: <BookOpen className="w-5 h-5 mr-2" /> },
  { key: "grades", label: "Grades", icon: <CheckCircle className="w-5 h-5 mr-2" /> },
  { key: "notes", label: "Notes", icon: <FileText className="w-5 h-5 mr-2" /> },
  { key: "info", label: "Course Info", icon: <Info className="w-5 h-5 mr-2" /> },
];

const LearningPath = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeSection, setActiveSection] = useState("modules");
  const [completedLessons, setCompletedLessons] = useState([]);
  const [firstUncompleted, setFirstUncompleted] = useState({ weekIdx: 0, modIdx: 0, lessonIdx: 0 });

  // Get courseId from navigation state (from dashboard/my-learning)
  const courseId = location.state?.courseId;

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      setLoading(true);
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`/api/courses/${courseId}`),
          axios.get(`/api/progress/${userId}/${courseId}`)
        ]);
        const courseData = Array.isArray(courseRes.data) ? courseRes.data[0] : courseRes.data;
        setCourse(courseData);
        setWeeks(courseData?.weeks || []);
        setCompletedLessons(progressRes.data.completedLessons || []);
      } catch (err) {
        setCourse(null);
        setWeeks([]);
        setCompletedLessons([]);
      } finally {
        setLoading(false);
      }
    };
    if (courseId && userId) fetchCourseAndProgress();
  }, [courseId, userId]);

  // Helper: is lesson completed
  const isLessonCompleted = (lessonTitle) => completedLessons.includes(lessonTitle);

  // Helper: is week completed (all lessons in all modules are completed)
  const isWeekCompleted = (week) => {
    const allLessonTitles = (week.modules || []).flatMap(
      m => (m.lessons || []).map(l => l.title)
    );
    return allLessonTitles.length > 0 && allLessonTitles.every(t => completedLessons.includes(t));
  };

  // Helper: week progress (0-1)
  const getWeekProgress = (week) => {
    const allLessonTitles = (week.modules || []).flatMap(
      m => (m.lessons || []).map(l => l.title)
    );
    if (!allLessonTitles.length) return 0;
    const completed = allLessonTitles.filter(t => completedLessons.includes(t)).length;
    return completed / allLessonTitles.length;
  };

  // Helper: module progress (0-1)
  const getModuleProgress = (mod) => {
    const lessons = mod.lessons || [];
    if (!lessons.length) return 0;
    const completed = lessons.filter(l => isLessonCompleted(l.title)).length;
    return completed / lessons.length;
  };

  // Helper: button label for module
  const getModuleButtonLabel = (mod) => {
    const progress = getModuleProgress(mod);
    return progress === 0 ? "Get Started" : "Resume";
  };

  // Find the first uncompleted lesson in the active week
  useEffect(() => {
    if (!weeks.length) return;
    const week = weeks[activeWeekIdx];
    let found = false;
    let indices = { weekIdx: activeWeekIdx, modIdx: 0, lessonIdx: 0 };
    for (let m = 0; m < (week.modules || []).length; m++) {
      const mod = week.modules[m];
      for (let l = 0; l < (mod.lessons || []).length; l++) {
        const lesson = mod.lessons[l];
        if (!isLessonCompleted(lesson.title)) {
          indices = { weekIdx: activeWeekIdx, modIdx: m, lessonIdx: l };
          found = true;
          break;
        }
      }
      if (found) break;
    }
    setFirstUncompleted(indices);
    // eslint-disable-next-line
  }, [weeks, activeWeekIdx, completedLessons]);

  // Helper: get flat lesson index for navigation
  const getFlatLessonIdx = (weekIdx, modIdx, lessonIdx) => {
    let idx = 0;
    for (let w = 0; w < weeks.length; w++) {
      for (let m = 0; m < (weeks[w].modules || []).length; m++) {
        for (let l = 0; l < (weeks[w].modules[m].lessons || []).length; l++) {
          if (w === weekIdx && m === modIdx && l === lessonIdx) return idx;
          idx++;
        }
      }
    }
    return 0;
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

  const activeWeek = weeks[activeWeekIdx] || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar: Weeks + Sections */}
      <aside className="w-full md:w-80 bg-white border-r shadow-sm flex-shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
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
          <ul className="space-y-2 mb-6">
            {weeks.map((week, idx) => {
              const progress = getWeekProgress(week);
              const isCompleted = progress === 1;
              return (
                <li
                  key={week._id || idx}
                  className={`flex items-center px-3 py-2 rounded cursor-pointer transition-colors ${
                    idx === activeWeekIdx && activeSection === "modules"
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setActiveWeekIdx(idx);
                    setActiveSection("modules");
                  }}
                >
                  <span className="mr-2">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle
                        className={`w-5 h-5 ${
                          progress > 0
                            ? "text-blue-400"
                            : "text-gray-300"
                        }`}
                        fill={progress > 0 ? "#60a5fa" : "none"}
                      />
                    )}
                  </span>
                  <span className="truncate font-medium">{`Week ${week.weekNumber}`}</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {Math.round(progress * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="font-semibold text-gray-700 mb-2">Sections</div>
          <ul className="space-y-2">
            {SIDEBAR_SECTIONS.slice(1).map((section) => (
              <li
                key={section.key}
                className={`flex items-center px-3 py-2 rounded cursor-pointer transition-colors ${
                  activeSection === section.key
                    ? "bg-blue-50 border-l-4 border-blue-600"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveSection(section.key)}
              >
                {section.icon}
                <span className="truncate font-medium">{section.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {/* Main Content: Section Content */}
      <main className="flex-1 flex flex-col items-center justify-start p-8">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow p-6">
          {/* Modules Section */}
          {activeSection === "modules" && (
            <>
              <h3 className="text-xl font-bold text-blue-700 mb-4">
                {activeWeek ? `Week ${activeWeek.weekNumber}` : "Select a week"}
              </h3>
              {activeWeek && activeWeek.modules && activeWeek.modules.length > 0 ? (
                <div className="space-y-6">
                  {activeWeek.modules.map((mod, modIdx) => (
                    <div
                      key={mod._id || modIdx}
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-blue-800">
                          {mod.title || `Module ${modIdx + 1}`}
                        </div>
                        <div className="text-gray-700 mb-2">
                          {mod.content || "No description available for this module."}
                        </div>
                        {mod.lessons && mod.lessons.length > 0 && (
                          <div className="mb-2">
                            <div className="font-semibold text-gray-700 mb-1">Lessons:</div>
                            <ul className="list-none space-y-1">
                              {mod.lessons.map((lesson, i) => (
                                <li key={lesson.title || i} className="flex items-center gap-2">
                                  {/* Use circle checkboxes for lessons */}
                                  <span>
                                    {isLessonCompleted(lesson.title) ? (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <Circle
                                        className={`w-5 h-5 ${
                                          isLessonCompleted(lesson.title)
                                            ? "text-green-500"
                                            : "text-blue-400"
                                        }`}
                                        fill={isLessonCompleted(lesson.title) ? "#22c55e" : "none"}
                                      />
                                    )}
                                  </span>
                                  <span className="font-medium">
                                    {lesson.title}
                                  </span>
                                  {lesson.duration && (
                                    <span className="text-xs text-gray-500 ml-2">({lesson.duration})</span>
                                  )}
                                  {/* Removed "Open in Player" button */}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        className="mt-2 md:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                        onClick={() => {
                          // If "Get Started", go to first uncompleted lesson in this week/module
                          if (getModuleButtonLabel(mod) === "Get Started") {
                            // Find first uncompleted lesson in this module
                            let lessonIdx = 0;
                            for (let l = 0; l < (mod.lessons || []).length; l++) {
                              if (!isLessonCompleted(mod.lessons[l].title)) {
                                lessonIdx = l;
                                break;
                              }
                            }
                            // Compute flat lesson index for CoursePlayer
                            const flatIdx = getFlatLessonIdx(activeWeekIdx, modIdx, lessonIdx);
                            navigate(`/course-player/${course._id}`, { state: { flatIdx } });
                          } else {
                            // Resume: go to first uncompleted lesson in week
                            const flatIdx = getFlatLessonIdx(
                              firstUncompleted.weekIdx,
                              firstUncompleted.modIdx,
                              firstUncompleted.lessonIdx
                            );
                            navigate(`/course-player/${course._id}`, { state: { flatIdx } });
                          }
                        }}
                      >
                        {getModuleButtonLabel(mod)}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">No modules available for this week.</div>
              )}
            </>
          )}
          {/* Grades Section */}
          {activeSection === "grades" && (
            <div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Grades</h3>
              <div className="text-gray-500 italic">Grades feature coming soon.</div>
            </div>
          )}
          {/* Notes Section */}
          {activeSection === "notes" && (
            <div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Notes</h3>
              <div className="text-gray-500 italic">Notes feature coming soon.</div>
            </div>
          )}
          {/* Course Info Section */}
          {activeSection === "info" && (
            <div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Course Information</h3>
              <div className="mb-2">
                <span className="font-semibold">Title:</span> {course.title}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Description:</span> {course.description}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Level:</span> {course.level}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Domain:</span> {course.domain}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Ideal Roles:</span> {Array.isArray(course.idealRoles) ? course.idealRoles.join(", ") : course.idealRoles}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Skills Covered:</span> {Array.isArray(course.skillsCovered) ? course.skillsCovered.join(", ") : course.skillsCovered}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Challenges Addressed:</span> {Array.isArray(course.challengesAddressed) ? course.challengesAddressed.join(", ") : course.challengesAddressed}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Duration (weeks):</span> {course.durationWeeks}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LearningPath;
