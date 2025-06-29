import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Play, CheckCircle, Menu, X, Clock } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import StudentNavbar from '../../components/StudentNavbar';

// Helper: flatten all lessons with their indices for navigation
function flattenLessons(weeks) {
  const flat = [];
  weeks?.forEach((week, weekIdx) => {
    week.modules?.forEach((mod, modIdx) => {
      mod.lessons?.forEach((lesson, lessonIdx) => {
        flat.push({
          weekIdx,
          modIdx,
          lessonIdx,
          lesson,
          week,
          mod,
        });
      });
    });
  });
  return flat;
}

const CoursePlayer = () => {
  const { id: courseId } = useParams();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const userId = user?._id;

  const [courseData, setCourseData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [flatLessons, setFlatLessons] = useState([]);
  const [currentFlatIdx, setCurrentFlatIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/courses/${courseId}`),
          axios.get(`http://localhost:8080/api/progress/${userId}/${courseId}`),
        ]);
        setCourseData(courseRes.data);
        setCompletedLessons(new Set(progressRes.data.completedLessons || []));
        // Flatten lessons for easier navigation
        const flat = flattenLessons(courseRes.data.weeks || []);
        setFlatLessons(flat);
        setCurrentFlatIdx(0);
      } catch (err) {
        console.error('Error loading course or progress:', err);
      }
    };

    if (userId) fetchData();
  }, [courseId, userId]);

  // Set initial lesson index if provided via navigation (from LearningPath)
  useEffect(() => {
    if (location.state && typeof location.state.flatIdx === "number" && flatLessons.length > 0) {
      setCurrentFlatIdx(location.state.flatIdx);
    }
    // eslint-disable-next-line
  }, [flatLessons, location.state]);

  // Helper to get current lesson data
  const currentLessonObj = flatLessons[currentFlatIdx] || {};
  const currentLessonData = currentLessonObj.lesson || {};
  const isCompleted = completedLessons.has(currentLessonData.title);

  const getYouTubeId = (url) => {
    if (!url) return '';
    // Accept both full and short YouTube URLs
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/embed\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  const handleMarkAsCompleted = async () => {
    try {
      if (!currentLessonData.title) return;
      if (!isCompleted) {
        await axios.post(`http://localhost:8080/api/progress/complete`, {
          userId,
          courseId,
          lessonTitle: currentLessonData.title,
        });
        setCompletedLessons((prev) => new Set(prev).add(currentLessonData.title));
      } else {
        // Remove lesson from completedLessons in DB and UI
        await axios.post(`http://localhost:8080/api/progress/uncomplete`, {
          userId,
          courseId,
          lessonTitle: currentLessonData.title,
        });
        setCompletedLessons((prev) => {
          const updated = new Set(prev);
          updated.delete(currentLessonData.title);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleLessonClick = (flatIdx) => {
    setCurrentFlatIdx(flatIdx);
    setSidebarOpen(false);
  };

  // Navigation helpers
  const goPrev = () => setCurrentFlatIdx((idx) => Math.max(0, idx - 1));
  const goNext = () => setCurrentFlatIdx((idx) => Math.min(flatLessons.length - 1, idx + 1));

  if (!courseData || !courseData.weeks) return <div className="p-6 text-gray-600">Loading course...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 break-words max-w-xs">
                {courseData.title}
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sidebar: List all lessons grouped by week/module */}
            {courseData.weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="border-b border-gray-100">
                <div className="p-3 bg-gray-50 font-semibold text-blue-700">
                  Week {week.weekNumber}
                </div>
                {week.modules.map((mod, modIdx) => (
                  <div key={modIdx} className="px-2">
                    <div className="p-2 text-gray-800 font-medium text-sm border-b">
                      {mod.title || `Module ${modIdx + 1}`}
                    </div>
                    {mod.lessons.map((lesson, lessonIdx) => {
                      // Find flat index for this lesson
                      const flatIdx = flatLessons.findIndex(
                        (l) =>
                          l.weekIdx === weekIdx &&
                          l.modIdx === modIdx &&
                          l.lessonIdx === lessonIdx
                      );
                      const isActive = flatIdx === currentFlatIdx;
                      const isLessonCompleted = completedLessons.has(lesson.title);
                      return (
                        <button
                          key={lessonIdx}
                          onClick={() => handleLessonClick(flatIdx)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                            isActive
                              ? 'bg-blue-100 border-r-4 border-blue-500'
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isLessonCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-gray-800 break-words">
                              {lesson.title || `Lesson ${lessonIdx + 1}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
              <span className="font-medium">Course Menu</span>
            </button>
          </div>

          <div className="bg-white border-b border-gray-200">
            <div className="p-4 lg:p-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {currentLessonData.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentLessonData.duration}
              </p>

              <div className="relative bg-black rounded-lg overflow-hidden mt-4" style={{ aspectRatio: '16/9' }}>
                {currentLessonData.videoUrl ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(currentLessonData.videoUrl)}?rel=0&modestbranding=1`}
                    title={currentLessonData.title}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-lg">
                    No video available for this lesson.
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleMarkAsCompleted}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{isCompleted ? 'Completed (Click to Undo)' : 'Mark as Completed'}</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={goPrev}
                    disabled={currentFlatIdx === 0}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentFlatIdx === flatLessons.length - 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {currentLessonObj.week && currentLessonObj.mod && (
                    <>
                      Week {currentLessonObj.weekIdx + 1}, Module {currentLessonObj.modIdx + 1}, Lesson {currentLessonObj.lessonIdx + 1}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white overflow-hidden p-4 text-gray-600">
            <p className="text-sm italic">Transcripts coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
