import React, { useState } from 'react';
import { Play, CheckCircle, Menu, X, Clock, FileText } from 'lucide-react';
import ChatAssistant from "../../components/ChatAssistant/ChatAssistant";

const CoursePlayer = () => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(new Set([0, 1]));

  // Dummy course data
  const courseData = {
    title: "Complete Web Development Bootcamp",
    modules: [
      {
        id: 1,
        title: "Module 1 - Getting Started",
        lessons: [
          { id: 1, title: "Introduction to Web Development", duration: "12:34", videoId: "dQw4w9WgXcQ" },
          { id: 2, title: "Setting Up Your Development Environment", duration: "18:45", videoId: "dQw4w9WgXcQ" },
          { id: 3, title: "HTML Fundamentals", duration: "25:12", videoId: "dQw4w9WgXcQ" }
        ]
      },
      {
        id: 2,
        title: "Module 2 - HTML & CSS Basics",
        lessons: [
          { id: 4, title: "HTML Structure and Semantics", duration: "22:18", videoId: "dQw4w9WgXcQ" },
          { id: 5, title: "CSS Styling and Layout", duration: "31:45", videoId: "dQw4w9WgXcQ" },
          { id: 6, title: "Responsive Design Principles", duration: "28:30", videoId: "dQw4w9WgXcQ" }
        ]
      },
      {
        id: 3,
        title: "Module 3 - JavaScript Fundamentals",
        lessons: [
          { id: 7, title: "Variables and Data Types", duration: "19:22", videoId: "dQw4w9WgXcQ" },
          { id: 8, title: "Functions and Scope", duration: "26:15", videoId: "dQw4w9WgXcQ" },
          { id: 9, title: "DOM Manipulation", duration: "33:40", videoId: "dQw4w9WgXcQ" }
        ]
      }
    ]
  };

  // Flatten lessons for easy indexing
  const allLessons = courseData.modules.flatMap(module => 
    module.lessons.map(lesson => ({ ...lesson, moduleTitle: module.title }))
  );

  const currentLessonData = allLessons[currentLesson];

  // Dummy transcript data
  const transcript = [
    { time: "00:00", text: "Welcome to this comprehensive course on web development. In this lesson, we'll cover the fundamental concepts that every developer needs to know." },
    { time: "00:15", text: "First, let's talk about what web development actually is. Web development is the process of creating websites and web applications that run on the internet." },
    { time: "00:35", text: "There are three main technologies that form the foundation of web development: HTML, CSS, and JavaScript." },
    { time: "00:52", text: "HTML, or HyperText Markup Language, is responsible for the structure and content of web pages. It uses tags to define elements like headings, paragraphs, and links." },
    { time: "01:15", text: "CSS, or Cascading Style Sheets, handles the visual presentation of web pages. It controls colors, fonts, layouts, and responsive design." },
    { time: "01:38", text: "JavaScript is the programming language that adds interactivity and dynamic behavior to websites. It can respond to user actions and manipulate the page content." },
    { time: "02:05", text: "Throughout this course, we'll dive deep into each of these technologies, starting with HTML fundamentals and gradually building up to advanced JavaScript concepts." },
    { time: "02:25", text: "By the end of this course, you'll have the skills to build complete, responsive web applications from scratch." }
  ];

  const handleLessonClick = (lessonIndex) => {
    setCurrentLesson(lessonIndex);
    setSidebarOpen(false);
  };

  const toggleCompletion = () => {
    const newCompleted = new Set(completedLessons);
    if (newCompleted.has(currentLessonData.id)) {
      newCompleted.delete(currentLessonData.id);
    } else {
      newCompleted.add(currentLessonData.id);
    }
    setCompletedLessons(newCompleted);
  };

  const isCompleted = completedLessons.has(currentLessonData.id);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold text-gray-900 break-words max-w-xs leading-snug truncate lg:truncate-0"
                style={{ whiteSpace: "normal" }}
              >
                {courseData.title}
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto">
            {courseData.modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-gray-100">
                <div className="p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {module.title}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {module.lessons.map((lesson) => {
                    const lessonIndex = allLessons.findIndex(
                      (l) => l.id === lesson.id
                    );
                    const isActive = lessonIndex === currentLesson;
                    const isLessonCompleted = completedLessons.has(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lessonIndex)}
                        className={`
                          w-full p-4 text-left hover:bg-blue-50 transition-colors duration-150
                          ${
                            isActive
                              ? "bg-blue-100 border-r-4 border-blue-500"
                              : ""
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {isLessonCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Play
                                className={`w-5 h-5 ${
                                  isActive ? "text-blue-600" : "text-gray-400"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`
                              text-sm font-medium break-words max-w-xs leading-snug
                              ${isActive ? "text-blue-900" : "text-gray-900"}
                            `}
                              title={lesson.title}
                            >
                              {lesson.title}
                            </h4>
                            <div className="flex items-center mt-1 space-x-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {lesson.duration}
                              </span>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-5 h-5" />
            <span className="font-medium">Course Menu</span>
          </button>
        </div>

        {/* Video Section */}
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

            {/* Video Player */}
            <div
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <iframe
                // src={`https://www.youtube.com/embed/${currentLessonData.videoId}?rel=0&modestbranding=1`}
                src={`https://www.youtube.com/embed/ZxKM3DCV2kE?rel=0&modestbranding=1`}
                title={currentLessonData.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Mark as Completed Button */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={toggleCompletion}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                  ${
                    isCompleted
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                `}
              >
                <CheckCircle className="w-5 h-5" />
                <span>{isCompleted ? "Completed" : "Mark as Completed"}</span>
              </button>

              <div className="text-sm text-gray-500">
                Lesson {currentLesson + 1} of {allLessons.length}
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="flex-1 bg-white overflow-hidden">
          <div className="p-4 lg:p-6 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Transcript
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {transcript.map((item, index) => (
                <div
                  key={index}
                  className="flex space-x-4 group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-150"
                >
                  <div className="flex-shrink-0">
                    <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
};

export default CoursePlayer;