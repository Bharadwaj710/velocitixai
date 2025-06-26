import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Play, CheckCircle, Menu, X, Clock } from 'lucide-react';
import AuthContext from '../../context/AuthContext'; // adjust if different

const CoursePlayer = () => {
  const { id: courseId } = useParams();
  const { user } = useContext(AuthContext); // get user from context
  const userId = user?._id;

  const [courseData, setCourseData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [currentLesson, setCurrentLesson] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/courses/${courseId}`),
          axios.get(`http://localhost:8080/api/progress/${userId}/${courseId}`)
        ]);

        setCourseData(courseRes.data);
        setCompletedLessons(new Set(progressRes.data.completedLessons || []));
      } catch (err) {
        console.error('Error loading course or progress:', err);
      }
    };

    if (userId) fetchData();
  }, [courseId, userId]);

  if (!courseData) return <div className="p-6 text-gray-600">Loading course...</div>;

  const allLessons = courseData.modules.flatMap((module) =>
    (module.lessons || []).map((lesson) => ({
      ...lesson,
      moduleTitle: module.title
    }))
  );

  const currentLessonData = allLessons[currentLesson];

  const getYouTubeId = (url) => {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  const isCompleted = completedLessons.has(currentLessonData.title);

  const handleLessonClick = (index) => {
    setCurrentLesson(index);
    setSidebarOpen(false);
  };

  const handleMarkAsCompleted = async () => {
    try {
      if (!isCompleted) {
        await axios.post('http://localhost:8080/api/progress/complete', {
          userId,
          courseId,
          lessonTitle: currentLessonData.title
        });

        const updated = new Set(completedLessons);
        updated.add(currentLessonData.title);
        setCompletedLessons(updated);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 break-words max-w-xs">
              {courseData.title}
            </h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {courseData.modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border-b border-gray-100">
                <div className="p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 text-sm">{module.title}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {(module.lessons || []).map((lesson, lessonIndex) => {
                    const globalIndex = allLessons.findIndex(l => l.title === lesson.title);
                    const isActive = globalIndex === currentLesson;
                    const isLessonCompleted = completedLessons.has(lesson.title);

                    return (
                      <button
                        key={lesson.title}
                        onClick={() => handleLessonClick(globalIndex)}
                        className={`w-full p-4 text-left hover:bg-blue-50 transition-colors duration-150
                          ${isActive ? 'bg-blue-100 border-r-4 border-blue-500' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {isLessonCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Play className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium break-words max-w-xs ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {lesson.title}
                            </h4>
                            <div className="flex items-center mt-1 space-x-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{lesson.duration}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Player */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <button onClick={() => setSidebarOpen(true)} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <Menu className="w-5 h-5" />
            <span className="font-medium">Course Menu</span>
          </button>
        </div>

        <div className="bg-white border-b border-gray-200">
          <div className="p-4 lg:p-6">
            <div className="mb-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {currentLessonData.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentLessonData.moduleTitle} • {currentLessonData.duration}
              </p>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(currentLessonData.videoUrl)}?rel=0&modestbranding=1`}
                title={currentLessonData.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleMarkAsCompleted}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                ${isCompleted ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
              </button>

              <div className="text-sm text-gray-500">
                Lesson {currentLesson + 1} of {allLessons.length}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white overflow-hidden p-4 text-gray-600">
          <p className="text-sm italic">Transcripts will be available soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
