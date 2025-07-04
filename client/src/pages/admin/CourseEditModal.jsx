import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CourseEditModal = ({ course, onClose, onSave }) => {
  const [editedCourse, setEditedCourse] = useState({
    ...course,
    durationWeeks: course.durationWeeks || "",
    weeks: course.weeks || [],
  });

  // --- NEW: Track transcript status for lessons ---
  const [lessonTranscriptStatus, setLessonTranscriptStatus] = useState({}); // {lessonId: true/false}

  // Fetch transcript status for all lessons in this course
  useEffect(() => {
    const fetchTranscriptStatus = async () => {
      const status = {};
      for (const week of editedCourse.weeks || []) {
        for (const mod of week.modules || []) {
          for (const lesson of mod.lessons || []) {
            if (lesson._id) {
              try {
                const res = await axios.get(
                  `/api/transcripts/by-lesson/${lesson._id}`
                );
                status[lesson._id] =
                  Array.isArray(res.data.transcript) &&
                  res.data.transcript.length > 0;
              } catch {
                status[lesson._id] = false;
              }
            }
          }
        }
      }
      setLessonTranscriptStatus(status);
    };
    fetchTranscriptStatus();
    // eslint-disable-next-line
  }, [editedCourse._id, editedCourse.weeks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "durationWeeks") {
      const numWeeks = parseInt(value) || 0;
      const newWeeks = Array.from({ length: numWeeks }, (_, index) => ({
        weekNumber: index + 1,
        modules: [],
      }));
      setEditedCourse((prev) => ({
        ...prev,
        durationWeeks: numWeeks,
        weeks: newWeeks,
      }));
    } else {
      setEditedCourse((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addModule = (weekIdx) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules.push({
      title: "",
      content: "",
      lessons: [],
    });
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const removeModule = (weekIdx, modIdx) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules.splice(modIdx, 1);
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const handleModuleChange = (weekIdx, modIdx, key, value) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules[modIdx][key] = value;
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const addLesson = (weekIdx, modIdx) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons.push({
      title: "",
      videoUrl: "",
      duration: "",
    });
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const removeLesson = (weekIdx, modIdx, lessonIdx) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons.splice(lessonIdx, 1);
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const handleLessonChange = (weekIdx, modIdx, lessonIdx, key, value) => {
    const updatedWeeks = [...editedCourse.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons[lessonIdx][key] = value;
    setEditedCourse({ ...editedCourse, weeks: updatedWeeks });
  };

  const handleSave = async () => {
    // Transform weeks to ensure correct structure
    const weeks = (editedCourse.weeks || []).map((week, idx) => ({
      weekNumber: week.weekNumber || idx + 1,
      modules: (week.modules || []).map((mod) => ({
        title: mod.title,
        content: mod.content,
        lessons: (mod.lessons || []).map((lesson) => ({
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration || "",
        })),
        resources: mod.resources || [],
        _id: mod._id, // preserve _id if present
      })),
      _id: week._id, // preserve _id if present
    }));

    const payload = {
      ...editedCourse,
      durationWeeks: parseInt(editedCourse.durationWeeks, 10),
      weeks,
    };
    delete payload.modules;

    try {
      await onSave(payload);
      toast.success("Course updated!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  // Helper: flatten all lessons
  const getAllLessons = (courseObj) => {
    const lessons = [];
    (courseObj.weeks || []).forEach((week) => {
      (week.modules || []).forEach((mod) => {
        (mod.lessons || []).forEach((lesson) => {
          lessons.push(lesson);
        });
      });
    });
    return lessons;
  };

  const allLessons = getAllLessons(editedCourse);
  const hasValidVideoId = allLessons.some(
    (lesson) => lesson.videoId && lesson.videoId.length === 11
  );

  // Helper: check if all lessons in a week have transcript
  const allLessonsHaveTranscript = (week) => {
    let foundLesson = false;
    for (const mod of week.modules || []) {
      for (const lesson of mod.lessons || []) {
        if (lesson._id) {
          foundLesson = true;
          if (!lessonTranscriptStatus[lesson._id]) return false;
        }
      }
    }
    return foundLesson;
  };

  const handleGenerateTranscriptForWeek = async (weekIdx) => {
    const week = editedCourse.weeks[weekIdx];
    const lessons = [];

    (week.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((lesson) => {
        if (lesson.videoUrl && lesson.videoId && lesson._id) {
          lessons.push({
            videoUrl: lesson.videoUrl,
            videoId: lesson.videoId,
            lessonId: lesson._id,
            courseId: editedCourse._id,
          });
        }
      });
    });

    if (lessons.length === 0) {
      toast.error("❌ No valid lessons with YouTube video IDs in this week.");
      return;
    }

    toast.info(
      `⏳ Transcript generation started for Week ${week.weekNumber}...`
    );
    try {
      await axios.post("/api/transcripts/generate-module", { lessons });
      toast.success(`✅ Transcript generated for Week ${week.weekNumber}!`);
      setTimeout(() => setLessonTranscriptStatus({}), 2000);
    } catch (err) {
      console.error("Transcript generation failed", err);
      toast.error("❌ Transcript generation failed for this week.");
    }
  };
  

  const handleGenerateTranscript = async () => {
    toast.info("⏳ Generating transcript for all lessons...");
    try {
      await axios.post("/api/transcripts/generate-course", {
        courseId: editedCourse._id,
      });
      toast.success("✅ Transcript generation completed for all lessons!");
      setTimeout(() => setLessonTranscriptStatus({}), 2000);
    } catch (err) {
      console.error("Transcript generation failed", err);
      toast.error("❌ Error generating transcripts for all lessons.");
    }
  };
  

  // Toggle quizEnabled for a lesson
  const handleQuizToggle = (weekIdx, modIdx, lessonIdx) => {
    setEditedCourse((prev) => {
      const updated = { ...prev };
      updated.weeks = [...updated.weeks];
      updated.weeks[weekIdx] = { ...updated.weeks[weekIdx] };
      updated.weeks[weekIdx].modules = [...updated.weeks[weekIdx].modules];
      updated.weeks[weekIdx].modules[modIdx] = {
        ...updated.weeks[weekIdx].modules[modIdx],
      };
      updated.weeks[weekIdx].modules[modIdx].lessons = [
        ...updated.weeks[weekIdx].modules[modIdx].lessons,
      ];
      const lesson = {
        ...updated.weeks[weekIdx].modules[modIdx].lessons[lessonIdx],
      };
      lesson.quizEnabled =
        lesson.quizEnabled === false ? true : !lesson.quizEnabled;
      updated.weeks[weekIdx].modules[modIdx].lessons[lessonIdx] = lesson;
      return updated;
    });
  };

  const handleGenerateQuiz = async (weekNumber) => {
    toast.info(`🧠 Generating quiz for Week ${weekNumber}...`);
    try {
      await axios.post(
        `/api/quiz/generate-module/${editedCourse._id}/${weekNumber}`
      );
      toast.success(`✅ Quiz generated for Week ${weekNumber}!`);
    } catch (err) {
      console.error(err);
      toast.error(`❌ Quiz generation failed for Week ${weekNumber}.`);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-4xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-4">Edit Course</h3>

        <input
          className="border p-2 w-full mb-2"
          value={editedCourse.title}
          placeholder="Course Title"
          name="title"
          onChange={handleInputChange}
        />
        <input
          className="border p-2 w-full mb-2"
          value={editedCourse.description}
          placeholder="Description"
          name="description"
          onChange={handleInputChange}
        />
        <input
          className="border p-2 w-full mb-4"
          value={editedCourse.durationWeeks}
          placeholder="Duration (weeks)"
          name="durationWeeks"
          type="number"
          onChange={handleInputChange}
        />

        {/* WEEK SECTIONS */}
        {editedCourse.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="mb-6 p-4 bg-gray-100 rounded-xl border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-bold text-blue-800">
                Week {week.weekNumber}
              </h4>
              {week.modules.some((mod) =>
                mod.lessons.some(
                  (lesson) => lesson.videoId && lesson.videoId.length === 11
                )
              ) && (
                <button
                  onClick={() => handleGenerateTranscriptForWeek(weekIdx)}
                  className="bg-green-500 text-white text-sm px-3 py-1 rounded"
                >
                  📥 Generate Transcript for this Week
                </button>
              )}
            </div>

            {week.modules.map((mod, modIdx) => (
              <div key={modIdx} className="mb-4 p-3 bg-white border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">Module {modIdx + 1}</h5>
                  <button
                    onClick={() => removeModule(weekIdx, modIdx)}
                    className="text-sm text-red-600"
                  >
                    Remove Module
                  </button>
                </div>

                <input
                  className="border p-2 w-full mb-2"
                  placeholder="Module Title"
                  value={mod.title}
                  onChange={(e) =>
                    handleModuleChange(weekIdx, modIdx, "title", e.target.value)
                  }
                />
                <textarea
                  className="border p-2 w-full mb-2"
                  placeholder="Module Content"
                  value={mod.content}
                  onChange={(e) =>
                    handleModuleChange(
                      weekIdx,
                      modIdx,
                      "content",
                      e.target.value
                    )
                  }
                />

                {/* Lessons inside module */}
                <div className="ml-2">
                  <h6 className="text-sm font-semibold mb-1">Lessons</h6>
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <div
                      key={lessonIdx}
                      className="flex flex-col md:flex-row gap-2 items-start mb-2"
                    >
                      <input
                        className="border p-2 flex-1 w-full"
                        placeholder="Lesson Title"
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonChange(
                            weekIdx,
                            modIdx,
                            lessonIdx,
                            "title",
                            e.target.value
                          )
                        }
                      />
                      <input
                        className="border p-2 flex-1 w-full"
                        placeholder="YouTube Video URL"
                        value={lesson.videoUrl}
                        onChange={(e) =>
                          handleLessonChange(
                            weekIdx,
                            modIdx,
                            lessonIdx,
                            "videoUrl",
                            e.target.value
                          )
                        }
                      />
                      <input
                        className="border p-2 w-32"
                        placeholder="Duration"
                        value={lesson.duration}
                        onChange={(e) =>
                          handleLessonChange(
                            weekIdx,
                            modIdx,
                            lessonIdx,
                            "duration",
                            e.target.value
                          )
                        }
                      />
                      <button
                        className="text-red-600 mt-1 md:mt-0"
                        onClick={() => removeLesson(weekIdx, modIdx, lessonIdx)}
                      >
                        ✕
                      </button>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={lesson.quizEnabled !== false}
                          onChange={() =>
                            handleQuizToggle(weekIdx, modIdx, lessonIdx)
                          }
                          className="accent-blue-600"
                        />
                        Enable Quiz
                      </label>
                    </div>
                  ))}
                  <button
                    className="text-blue-600 text-sm mt-1"
                    onClick={() => addLesson(weekIdx, modIdx)}
                  >
                    + Add Lesson
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => addModule(weekIdx)}
              className="text-green-600 text-sm"
            >
              + Add Module
            </button>

            {/* --- Generate Quiz Button for this week --- */}
            {allLessonsHaveTranscript(week) ? (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded mt-2"
                onClick={() => handleGenerateQuiz(week.weekNumber)}
              >
                📝 Generate Quiz for Week {week.weekNumber}
              </button>
            ) : (
              <div className="text-xs text-gray-500 mt-2">
                Generate transcripts for all lessons in this week to enable quiz
                generation.
              </div>
            )}
          </div>
        ))}

        {hasValidVideoId && (
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded mt-4"
            onClick={handleGenerateTranscript}
          >
            📜 Generate Transcript for All Lessons
          </button>
        )}

        <div className="text-right mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;
