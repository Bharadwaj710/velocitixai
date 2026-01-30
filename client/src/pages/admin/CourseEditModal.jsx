import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import apiClient from "../../api/apiClient";
import { toast } from "react-toastify";
import { XCircle } from "lucide-react";
import { ensureAbsoluteUrl } from "../../utils/urlHelper";

// Simple ProgressBar component
const ProgressBar = ({ progress }) => {
  const percent =
    progress.total === 0
      ? 0
      : Math.round((progress.completed / progress.total) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span>
          {progress.label}: {progress.completed} / {progress.total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-2">
        <div
          className="bg-blue-600 h-2 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// Simple 3-dot dropdown menu (no external lib)
const DropdownMenu = ({ children, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1 rounded hover:bg-gray-200"
        onClick={() => setOpen((v) => !v)}
        title="Actions"
        type="button"
      >
        <span className="text-xl font-bold">⋮</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                opt.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (!opt.disabled) {
                  setOpen(false);
                  opt.onClick();
                }
              }}
              disabled={opt.disabled}
            >
              {opt.icon && <span className="mr-2">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
};

const CourseEditModal = ({ course, onClose, onSave }) => {
  const [editedCourse, setEditedCourse] = useState({
    ...course,
    durationWeeks: course.durationWeeks || "",
    weeks: course.weeks || [],
  });
  // Add a new state to track selected PDFs for each lesson before upload
  const [pendingPdfs, setPendingPdfs] = useState({}); // { [weekIdx-modIdx-lessonIdx]: File }

  // --- NEW: Track transcript status for lessons ---
  const [lessonTranscriptStatus, setLessonTranscriptStatus] = useState({}); // {lessonId: true/false}

  // --- NEW: Track quiz/transcript generation status and loading ---
  const [generatedQuizzes, setGeneratedQuizzes] = useState({});
  const [generatedTranscripts, setGeneratedTranscripts] = useState({});
  const [lessonLoading, setLessonLoading] = useState({}); // { [lessonId_type]: true/false }

  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const [showTranscriptProgress, setShowTranscriptProgress] = useState(false);

  // --- Status state for progress and per-lesson status ---
  const [transcriptStatus, setTranscriptStatus] = useState({});
  const [quizStatus, setQuizStatus] = useState({});
  // For fast lookup by videoId
  const [transcriptMap, setTranscriptMap] = useState({});
  const [quizMap, setQuizMap] = useState({});

  const [aiInterviewEnabled, setAiInterviewEnabled] = useState(
    course.aiInterviewEnabled || false
  );

  (editedCourse.weeks || []).forEach((week) => {
    (week.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((lesson) => {
        if (lesson.videoId && transcriptStatus[lesson._id])
          transcriptMap[lesson.videoId] = true;
        if (lesson.videoId && quizStatus[lesson._id])
          quizMap[lesson.videoId] = true;
      });
    });
  });
  const [progress, setProgress] = useState({
    transcripts: { completed: 0, total: 0 },
    quizzes: { completed: 0, total: 0 },
  });
  const [loadingLesson, setLoadingLesson] = useState({}); // {lessonId: true/false}

  // --- Real-time transcript progress tracking ---
  const [progressMap, setProgressMap] = useState({});

  // Fetch transcript status for all lessons in this course
  useEffect(() => {
    const fetchTranscriptStatus = async () => {
      const status = {};
      for (const week of editedCourse.weeks || []) {
        for (const mod of week.modules || []) {
          for (const lesson of mod.lessons || []) {
            if (lesson._id) {
              try {
                const res = await apiClient.get(
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

  // Fetch quiz/transcript status for all lessons in this course
  useEffect(() => {
    const fetchStatus = async () => {
      const tStatus = {};
      const qStatus = {};
      let tCompleted = 0,
        qCompleted = 0,
        tTotal = 0,
        qTotal = 0;
      const lessons = [];
      (editedCourse.weeks || []).forEach((week) =>
        (week.modules || []).forEach((mod) =>
          (mod.lessons || []).forEach((lesson) => {
            if (lesson._id) lessons.push(lesson._id);
          })
        )
      );
      tTotal = lessons.length;
      qTotal = lessons.length;
      await Promise.all(
        lessons.map(async (lessonId) => {
          // Transcript
          try {
            const res = await apiClient.get(
              `/api/transcripts/by-lesson/${lessonId}`
            );
            if (
              res.status === 200 &&
              Array.isArray(res.data.transcript) &&
              res.data.transcript.length
            ) {
              tStatus[lessonId] = true;
              tCompleted++;
            } else {
              tStatus[lessonId] = false;
            }
          } catch {
            tStatus[lessonId] = false;
          }
          // Quiz
          try {
            const res = await apiClient.get(`/api/quiz/${lessonId}`);
            if (res.status === 200 && res.data && res.data.questions?.length) {
              qStatus[lessonId] = true;
              qCompleted++;
            } else {
              qStatus[lessonId] = false;
            }
          } catch {
            qStatus[lessonId] = false;
          }
        })
      );
      setTranscriptStatus(tStatus);
      setQuizStatus(qStatus);
      setProgress({
        transcripts: { completed: tCompleted, total: tTotal },
        quizzes: { completed: qCompleted, total: qTotal },
      });
    };
    fetchStatus();
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
    // 1. Upload all pending PDFs and collect their URLs
    const pdfUploads = [];
    for (
      let weekIdx = 0;
      weekIdx < (editedCourse.weeks || []).length;
      weekIdx++
    ) {
      const week = editedCourse.weeks[weekIdx];
      for (let modIdx = 0; modIdx < (week.modules || []).length; modIdx++) {
        const mod = week.modules[modIdx];
        for (
          let lessonIdx = 0;
          lessonIdx < (mod.lessons || []).length;
          lessonIdx++
        ) {
          const lesson = mod.lessons[lessonIdx];
          const pendingKey = `${weekIdx}-${modIdx}-${lessonIdx}`;
          if (pendingPdfs[pendingKey]) {
            const formData = new FormData();
            formData.append("pdf", pendingPdfs[pendingKey]);
            pdfUploads.push(
              axios
                .post(
                  `${process.env.REACT_APP_API_BASE_URL}/api/upload/pdf`,
                  formData
                )
                .then((res) => ({
                  weekIdx,
                  modIdx,
                  lessonIdx,
                  name: res.data.name,
                  url: res.data.url,
                }))
            );
          }
        }
      }
    }
    const uploadedPdfs = await Promise.all(pdfUploads);

    // 2. Attach uploaded PDFs to lessons' resources
    const weeksWithPdfs = (editedCourse.weeks || []).map((week, weekIdx) => ({
      ...week,
      modules: (week.modules || []).map((mod, modIdx) => ({
        ...mod,
        lessons: (mod.lessons || []).map((lesson, lessonIdx) => {
          const found = uploadedPdfs.find(
            (pdf) =>
              pdf.weekIdx === weekIdx &&
              pdf.modIdx === modIdx &&
              pdf.lessonIdx === lessonIdx
          );
          if (found) {
            return {
              ...lesson,
              resources: [{ name: found.name, url: found.url }],
            };
          }
          return lesson;
        }),
      })),
    }));

    // 3. Prepare payload
    const weeks = (weeksWithPdfs || []).map((week, idx) => ({
      weekNumber: week.weekNumber || idx + 1,
      modules: (week.modules || []).map((mod) => ({
        title: mod.title,
        content: mod.content,
        lessons: (mod.lessons || []).map((lesson) => ({
          _id: lesson._id, // ✅ Preserve lesson ID
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration || "",
          resources: lesson.resources || [],
        })),
        resources: mod.resources || [],
        _id: mod._id,
      })),
      _id: week._id,
    }));

    const payload = {
      ...editedCourse,
      durationWeeks: parseInt(editedCourse.durationWeeks, 10),
      weeks,
      aiInterviewEnabled,
    };
    delete payload.modules;

    try {
      await onSave(payload);
      toast.success("Course updated!");
      setPendingPdfs({});
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  // Helper: flatten all lessons
  // --- Delete lesson handler ---
  const handleDeleteLesson = async (weekIdx, modIdx, lessonIdx, lesson) => {
    // Optional: confirmation dialog
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    // If lesson has no _id, just remove from state
    if (!lesson._id) {
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
        updated.weeks[weekIdx].modules[modIdx].lessons.splice(lessonIdx, 1);
        return updated;
      });
      toast.success("Lesson removed.");
      return;
    }
    // Else, call backend to delete lesson, transcript, and quiz
    try {
      // Delete lesson from course
      await axios.delete(`/api/lessons/${lesson._id}`);
      // Delete transcript
      await axios.delete(`/api/transcripts/by-lesson/${lesson._id}`);
      // Delete quiz
      await axios.delete(`/api/quiz/by-lesson/${lesson._id}`);
      // Remove from state
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
        updated.weeks[weekIdx].modules[modIdx].lessons.splice(lessonIdx, 1);
        return updated;
      });
      toast.success("Lesson and related data deleted.");
    } catch (err) {
      toast.error("Failed to delete lesson or related data.");
    }
  };

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

  // PDF upload handler for a lesson
  const handlePdfUpload = async (weekIdx, modIdx, lessonIdx, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      // Always use backend API base URL for all PDF-related endpoints
      const API_BASE = `${process.env.REACT_APP_API_BASE_URL}`;
      // Upload PDF to backend (Cloudinary)
      const uploadRes = await apiClient.post(`/api/upload/pdf`, formData);
      const { url, name } = uploadRes.data;
      // Save PDF to lesson in backend (persist in DB)
      const lessonId =
        editedCourse.weeks[weekIdx].modules[modIdx].lessons[lessonIdx]._id;
      const courseId = editedCourse._id;
      await apiClient.put(
        `/api/courses/${courseId}/lessons/${lessonId}/add-pdf`,
        {
          pdfName: name,
          pdfUrl: url,
        }
      );
      // Fetch updated course to get new resources array
      const updated = await apiClient.get(`/api/courses/${courseId}`);
      setEditedCourse(updated.data);
      toast.success("PDF uploaded and attached!");
    } catch (err) {
      toast.error("Failed to upload PDF");
    }
  };

  // Remove PDF from lesson (optional: you may want to call a backend endpoint for this)
  const handleRemovePdf = (weekIdx, modIdx, lessonIdx, pdfIdx) => {
    setEditedCourse((prev) => {
      const updated = { ...prev };
      const lesson = updated.weeks[weekIdx].modules[modIdx].lessons[lessonIdx];
      lesson.resources = (lesson.resources || []).filter(
        (_, i) => i !== pdfIdx
      );
      return updated;
    });
  };

  const handlePdfSelect = (weekIdx, modIdx, lessonIdx, file) => {
    if (!file) return;
    setPendingPdfs((prev) => ({
      ...prev,
      [`${weekIdx}-${modIdx}-${lessonIdx}`]: file,
    }));
  };

  const handleRemovePendingPdf = (weekIdx, modIdx, lessonIdx) => {
    setPendingPdfs((prev) => {
      const updated = { ...prev };
      delete updated[`${weekIdx}-${modIdx}-${lessonIdx}`];
      return updated;
    });
  };

  // --- Poll progress for all in-progress lessons every 2s ---
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(progressMap).forEach(async (videoId) => {
        const current = progressMap[videoId];
        if (!current?.inProgress) return;

        try {
          const res = await axios.get(
            `http://localhost:8000/progress/${videoId}`
          );
          const newBackendPercent = res.data.progress;

          setProgressMap((prev) => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              percent: Math.max(prev[videoId].percent, newBackendPercent),
              lastBackendPercent: newBackendPercent,
              inProgress: true,
            },
          }));

          if (newBackendPercent >= 100) {
            setTimeout(() => {
              setProgressMap((prev) => ({
                ...prev,
                [videoId]: {
                  ...prev[videoId],
                  inProgress: false,
                },
              }));
            }, 1000); // Show 100% for 1s
          }
        } catch (err) {
          setProgressMap((prev) => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              inProgress: false,
              error: "Error fetching progress",
            },
          }));
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [progressMap]);

  const handleGenerateTranscriptForLesson = async (lesson) => {
    const { videoUrl, videoId, _id: lessonId, courseId } = lesson;
    if (!lessonId || !videoUrl || !videoId) {
      toast.error("Lesson video info missing.");
      return;
    }
    setProgressMap((prev) => ({
      ...prev,
      [videoId]: {
        percent: 5,
        lastBackendPercent: 5,
        inProgress: true,
        type: "transcript",
      },
    }));
    try {
      await axios.post("http://localhost:8000/generate-transcript", {
        videoUrl,
        videoId,
        lessonId,
        courseId,
      });
      setTranscriptMap((prev) => ({ ...prev, [videoId]: true })); // <-- update immediately
      toast.success("Transcript generation complete");
      setProgressMap((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          inProgress: false,
        },
      }));
    } catch (err) {
      toast.error("Failed to generate transcript");
      setProgressMap((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          inProgress: false,
          error: "Error generating transcript",
        },
      }));
    }
  };

  const handleGenerateQuizForLesson = async (lesson) => {
    if (!lesson._id) {
      toast.error("Lesson missing.");
      return;
    }
    const videoId = lesson.videoId;
    setProgressMap((prev) => ({
      ...prev,
      [videoId]: {
        percent: 5,
        inProgress: true,
        type: "quiz",
      },
    }));
    try {
      // Fetch transcript if not present
      let transcript = lesson.transcript;
      if (!transcript) {
        const res = await axios.get(`/api/transcripts/by-lesson/${lesson._id}`);
        transcript = res.data?.transcript;
      }
      if (!transcript || !transcript.length) {
        setProgressMap((prev) => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            inProgress: false,
          },
        }));
        toast.error("Transcript required before generating quiz.");
        return;
      }
      const res = await axios.post("/api/quiz/generate", {
        lessonId: lesson._id,
        transcript,
      });
      if (res.status === 200) {
        setQuizMap((prev) => ({ ...prev, [videoId]: true }));
        toast.success("Quiz generated!");
        setProgressMap((prev) => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            inProgress: false,
          },
        }));
      } else {
        setProgressMap((prev) => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            inProgress: false,
          },
        }));
        toast.error("Quiz generation failed.");
      }
    } catch (err) {
      setProgressMap((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          inProgress: false,
        },
      }));
      toast.error("Quiz generation failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-4xl w-full relative overflow-y-auto max-h-[90vh]">
        {/* --- Close Modal Button (top-right) --- */}
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-gray-400 hover:text-red-600 text-2xl z-50"
          aria-label="Close"
        >
          <XCircle className="w-7 h-7" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
        {/* WEEK SECTIONS */}
        {editedCourse.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="mb-6 p-4 bg-gray-100 rounded-xl border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-bold text-blue-800">
                Week {week.weekNumber}
              </h4>
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
                      key={lesson._id || lessonIdx}
                      className="flex flex-col gap-1 mb-4 p-3 border rounded bg-gray-50 relative"
                    >
                      {/* Delete lesson button (top-left) */}
                      <button
                        className="absolute top-2 left-2 text-red-500 hover:text-red-700 font-bold z-10"
                        onClick={() =>
                          handleDeleteLesson(weekIdx, modIdx, lessonIdx, lesson)
                        }
                        title="Delete Lesson"
                        aria-label="Delete Lesson"
                      >
                        ×
                      </button>
                      <div className="flex flex-row items-center gap-2 w-full">
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
                        {/* Inline transcript/quiz buttons */}
                        <div className="flex gap-2 mt-2">
                          {/* Transcript Button */}
                          {(() => {
                            const hasTranscript =
                              lesson.videoId && transcriptMap[lesson.videoId];
                            const isLoading =
                              progressMap[lesson.videoId]?.inProgress &&
                              progressMap[lesson.videoId]?.type ===
                                "transcript";
                            const canGenerate =
                              !!lesson.videoId && !!lesson._id;
                            let btnColor = hasTranscript
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-orange-500 hover:bg-orange-600";
                            let btnText = hasTranscript
                              ? "Regenerate\nTranscript"
                              : "Generate\nTranscript";
                            let disabled = isLoading || !canGenerate || hasTranscript;
                            let tooltip = !lesson._id
                              ? "Save lesson before generating transcript"
                              : !lesson.videoId
                              ? "Add a valid videoId"
                              : "";
                            if (isLoading) btnText = "...";
                            return (
                              <button
                                className={`px-3 py-2 text-xs font-medium rounded-md whitespace-pre-line text-center text-white ${btnColor} ${
                                  disabled
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={disabled}
                                title={
                                  disabled && tooltip ? tooltip : undefined
                                }
                                onClick={() =>
                                  !disabled &&
                                  handleGenerateTranscriptForLesson(lesson)
                                }
                              >
                                {btnText}
                              </button>
                            );
                          })()}
                          {/* Quiz Button */}
                          {(() => {
                            const hasQuiz =
                              lesson.videoId && quizMap[lesson.videoId];
                            const hasTranscript =
                              lesson.videoId && transcriptMap[lesson.videoId];
                            const isLoading =
                              progressMap[lesson.videoId]?.inProgress &&
                              progressMap[lesson.videoId]?.type === "quiz";
                            let btnColor = hasQuiz
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-orange-500 hover:bg-orange-600";
                            let btnText = hasQuiz
                              ? "Regenerate\nQuiz"
                              : "Generate\nQuiz";
                            let disabled = isLoading || !hasTranscript || hasQuiz;
                            let tooltip = !hasTranscript
                              ? "Transcript required before generating quiz"
                              : "";
                            if (isLoading) btnText = "...";
                            return (
                              <button
                                className={`px-3 py-2 text-xs font-medium rounded-md whitespace-pre-line text-center text-white ${btnColor} ${
                                  disabled
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={disabled}
                                title={
                                  disabled && tooltip ? tooltip : undefined
                                }
                                onClick={() =>
                                  !disabled &&
                                  handleGenerateQuizForLesson(lesson)
                                }
                              >
                                {btnText}
                              </button>
                            );
                          })()}
                        </div>
                        {/* PDF select */}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="application/pdf"
                            id={`pdf-input-${weekIdx}-${modIdx}-${lessonIdx}`}
                            className="hidden"
                            onChange={(e) =>
                              handlePdfSelect(
                                weekIdx,
                                modIdx,
                                lessonIdx,
                                e.target.files[0]
                              )
                            }
                          />
                          <label
                            htmlFor={`pdf-input-${weekIdx}-${modIdx}-${lessonIdx}`}
                            className="bg-blue-600 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-700 whitespace-nowrap"
                          >
                            Select PDF
                          </label>
                        </div>
                      </div>
                      {/* --- Real-time transcript progress bar (Flask backend) --- */}
                      {progressMap[lesson.videoId]?.inProgress && (
                        <div className="w-full mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>
                              {progressMap[lesson.videoId]?.type === "quiz"
                                ? "Generating quiz..."
                                : "Generating transcript..."}
                            </span>
                            <span>{progressMap[lesson.videoId].percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2">
                            <div
                              className="bg-blue-500 h-2 rounded"
                              style={{
                                width: `${
                                  progressMap[lesson.videoId].percent
                                }%`,
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {progressMap[lesson.videoId]?.percent === 100 &&
                        progressMap[lesson.videoId]?.type === "transcript" && (
                          <p className="text-green-600 text-xs mt-1">
                            ✅ Transcript generated
                          </p>
                        )}

                      {progressMap[lesson.videoId]?.percent === 100 &&
                        progressMap[lesson.videoId]?.type === "quiz" && (
                          <p className="text-green-600 text-xs mt-1">
                            ✅ Quiz generated
                          </p>
                        )}

                      {progressMap[lesson.videoId]?.error && (
                        <p className="text-red-600 text-xs mt-1">
                          {progressMap[lesson.videoId].error}
                        </p>
                      )}

                      {/* PDF display at bottom */}
                      <div className="flex flex-col gap-1 mt-2">
                        {pendingPdfs[`${weekIdx}-${modIdx}-${lessonIdx}`] && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-700">
                              📄{" "}
                              {
                                pendingPdfs[`${weekIdx}-${modIdx}-${lessonIdx}`]
                                  .name
                              }
                            </span>
                            <button
                              className="text-xs text-red-500"
                              onClick={() =>
                                handleRemovePendingPdf(
                                  weekIdx,
                                  modIdx,
                                  lessonIdx
                                )
                              }
                              title="Remove PDF"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {lesson.resources && lesson.resources.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-700">
                              📄 {lesson.resources[0].name}
                            </span>
                            <a
                              href={ensureAbsoluteUrl(lesson.resources[0].url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-xs"
                            >
                              View
                            </a>
                            <button
                              className="text-xs text-red-500"
                              onClick={() =>
                                handleRemovePdf(weekIdx, modIdx, lessonIdx, 0)
                              }
                              title="Remove PDF"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
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
          </div>
        ))}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">
              Enable AI Interview
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aiInterviewEnabled}
                onChange={(e) => setAiInterviewEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors duration-300"></div>
              <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 transform peer-checked:translate-x-full"></div>
            </label>
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;
