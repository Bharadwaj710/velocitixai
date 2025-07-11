import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Play,
  CheckCircle,
  Menu,
  X,
  FileText,
  Video,
  Lock,
  Book,
  ListChecks,
  ClipboardCheck,
} from "lucide-react";
import AuthContext from "../../context/AuthContext";
import StudentNavbar from "../../components/StudentNavbar";
import YouTube from "react-youtube";
import ChatAssistant from "../../components/ChatAssistant/ChatAssistant";
import { saveNote, fetchNotes, deleteNote, updateNote } from "../../api/notes";
import { ChatProvider } from "../../context/ChatContext";
import QuizSection from "./QuizSection";
// Helper: flatten all lessons and PDFs for navigation and progress
function flattenItems(weeks) {
  const flat = [];
  weeks?.forEach((week, weekIdx) => {
    week.modules?.forEach((mod, modIdx) => {
      mod.lessons?.forEach((lesson, lessonIdx) => {
        // Video lesson
        flat.push({
          type: "video",
          weekIdx,
          modIdx,
          lessonIdx,
          lesson,
          week,
          mod,
          title: lesson.title,
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
        });
        // PDFs (readings) attached to this lesson
        (lesson.resources || []).forEach((pdf, pdfIdx) => {
          flat.push({
            type: "pdf",
            weekIdx,
            modIdx,
            lessonIdx,
            pdfIdx,
            lesson,
            week,
            mod,
            title: pdf.name,
            pdfUrl: pdf.url,
            resourceName: pdf.name,
          });
        });
      });
    });
  });
  return flat;
}

// --- Replace getIframePdfUrl with logic from LearningPath (open in iframe, not download) ---
function getIframePdfUrl(url) {
  if (!url) return "";
  // If Cloudinary, force inline display for iframe (use Google Docs Viewer as fallback)
  if (url.includes("cloudinary.com")) {
    // Use Google Docs Viewer for best compatibility
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
  }
  // If already a direct .pdf link, use Google Docs Viewer as fallback
  if (url.endsWith(".pdf")) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
  }
  // If relative, prefix with http://localhost:8080 (for local dev)
  if (url.startsWith("/")) return `http://localhost:8080${url}`;
  // Otherwise, return as is
  return url;
}

// Helper: collect all PDFs grouped by module
function getAllMaterialsByModule(weeks) {
  const materials = [];
  weeks?.forEach((week, weekIdx) => {
    week.modules?.forEach((mod, modIdx) => {
      const pdfs = [];
      mod.lessons?.forEach((lesson, lessonIdx) => {
        (lesson.resources || []).forEach((pdf) => {
          pdfs.push({
            ...pdf,
            lessonTitle: lesson.title,
            weekIdx,
            modIdx,
            lessonIdx,
            pdfUrl: pdf.url,
            pdfName: pdf.name,
          });
        });
      });
      if (pdfs.length > 0) {
        materials.push({
          weekIdx,
          modIdx,
          moduleTitle: mod.title || `Module ${modIdx + 1}`,
          pdfs,
        });
      }
    });
  });
  return materials;
}

const TABS = [
  { key: "transcript", label: "Transcript" },
  { key: "notes", label: "Notes" },
  { key: "materials", label: "Materials" },
];

const CoursePlayer = () => {
  const { id: courseId } = useParams();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const [savedNotes, setSavedNotes] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [currentSelection, setCurrentSelection] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]); // Array of completed lessonIds
  const [quizResults, setQuizResults] = useState([]); // Array of { lessonId, score, passed }
  const [flatItems, setFlatItems] = useState([]);
  const [currentFlatIdx, setCurrentFlatIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [activeTranscriptIdx, setActiveTranscriptIdx] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState(null);
  const transcriptRefs = useRef([]);
  const transcriptContainerRef = useRef(null);
  const activeLineRef = useRef(null);
  const [weekOpen, setWeekOpen] = useState(true);
  const { pdfUrl, isPdf } = location.state || {};
  const resourceName = location.state?.resourceName;
  const [activeTab, setActiveTab] = useState("transcript");
  const [materialsByModule, setMaterialsByModule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectionCoords, setSelectionCoords] = useState({ x: 0, y: 0 });
  const [openQuizLessonIdx, setOpenQuizLessonIdx] = useState(null); // flatIdx of quiz being taken
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  // quizPassedLessons is now derived from quizResults

  const handleStateChange = (event) => {
    // Optional: console log player states
    // 1 = playing, 2 = paused, etc.
    console.log("Player state:", event.data);
  };
  useEffect(() => {
    if (userId && courseId) {
      fetchNotes(userId, courseId).then((res) => setSavedNotes(res.data));
    }
  }, [userId, courseId]);

  // Fetch notes and set highlightedNotes for all transcriptIdxs
  useEffect(() => {
    if (userId && courseId) {
      fetchNotes(userId, courseId).then((res) => {
        setSavedNotes(res.data);
        // No need for highlightedNotes state, highlight directly from savedNotes
      });
    }
  }, [userId, courseId]);

  // --- Selection logic for transcript highlighting (no highlight before save, only highlight after save) ---
  const handleTextSelection = (seg, idx, e) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setCurrentSelection(null);
      return;
    }
    // Only allow if anchorNode is inside the transcript text span
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    let parent = anchorNode.parentElement || anchorNode.parentNode;
    let found = false;
    while (parent) {
      if (parent.classList && parent.classList.contains("note-selectable")) {
        found = true;
        break;
      }
      parent = parent.parentElement || parent.parentNode;
    }
    if (!found) {
      setSelectedText("");
      setCurrentSelection(null);
      return;
    }
    const selectedString = selection.toString();
    if (!selectedString || !selectedString.trim()) {
      setSelectedText("");
      setCurrentSelection(null);
      return;
    }

    // Multi-line selection support with char offsets
    let startIdx = idx;
    let endIdx = idx;
    let charStart = 0;
    let charEnd = 0;

    try {
      const anchorElem = selection.anchorNode.parentElement;
      const focusElem = selection.focusNode.parentElement;
      const anchorIdx = parseInt(anchorElem?.getAttribute("data-index"));
      const focusIdx = parseInt(focusElem?.getAttribute("data-index"));
      if (!isNaN(anchorIdx) && !isNaN(focusIdx)) {
        startIdx = Math.min(anchorIdx, focusIdx);
        endIdx = Math.max(anchorIdx, focusIdx);
      }
      if (startIdx === endIdx) {
        charStart = Math.min(selection.anchorOffset, selection.focusOffset);
        charEnd = Math.max(selection.anchorOffset, selection.focusOffset);
      } else {
        if (anchorIdx < focusIdx) {
          charStart = selection.anchorOffset;
          charEnd = selection.focusOffset;
        } else {
          charStart = selection.focusOffset;
          charEnd = selection.anchorOffset;
        }
      }
    } catch {}
    setSelectedText(selectedString);
    setCurrentSelection({ startIdx, endIdx, charStart, charEnd });
  };

  // --- Save Note logic (single API call for multi-line, with char offsets) ---
  const handleSaveNote = () => {
    if (!selectedText || !currentSelection) return;
    let { startIdx, endIdx, charStart, charEnd } = currentSelection;
    startIdx = Number(startIdx);
    endIdx = Number(endIdx);
    charStart = Number(charStart);
    charEnd = Number(charEnd);
    if (isNaN(startIdx) || isNaN(endIdx)) return;
    if (!selectedText.trim()) return;
    saveNote({
      userId,
      courseId,
      lessonTitle: currentLessonData.title,
      noteContent: selectedText,
      transcriptIdx: startIdx,
      endIdx: endIdx,
      charStart,
      charEnd,
    }).then((res) => {
      fetchNotes(userId, courseId).then((res) => setSavedNotes(res.data));
    });
    setSelectedText("");
    setCurrentSelection(null);
    window.getSelection().removeAllRanges();
  };

  // --- Highlight logic: highlight only the exact saved word/phrase in each transcript line, never before saving ---
  function renderTranscriptWithHighlights(seg, idx) {
    let text = seg.text;
    let parts = [];
    let lastIdx = 0;
    let highlights = [];

    // Only highlight SAVED notes, not current selection
    savedNotes.forEach((n) => {
      if (idx < n.transcriptIdx || idx > n.endIdx || !n.noteContent) return;
      // Single-line highlight
      if (n.transcriptIdx === n.endIdx) {
        if (idx === n.transcriptIdx) {
          if (
            typeof n.charStart === "number" &&
            typeof n.charEnd === "number" &&
            n.charStart !== n.charEnd
          ) {
            const start = Math.max(0, Math.min(n.charStart, text.length));
            const end = Math.max(0, Math.min(n.charEnd, text.length));
            if (start !== end) highlights.push({ start, end });
          } else {
            const start = text.indexOf(n.noteContent);
            if (start !== -1) {
              highlights.push({ start, end: start + n.noteContent.length });
            }
          }
        }
      } else {
        // Multi-line highlight
        if (idx === n.transcriptIdx) {
          const start =
            typeof n.charStart === "number"
              ? Math.max(0, Math.min(n.charStart, text.length))
              : 0;
          highlights.push({ start, end: text.length });
        } else if (idx === n.endIdx) {
          const end =
            typeof n.charEnd === "number"
              ? Math.max(0, Math.min(n.charEnd, text.length))
              : text.length;
          highlights.push({ start: 0, end });
        } else if (idx > n.transcriptIdx && idx < n.endIdx) {
          highlights.push({ start: 0, end: text.length });
        }
      }
    });

    if (!highlights.length) return text;

    highlights = highlights
      .filter((h) => h.start < h.end)
      .sort((a, b) => a.start - b.start);

    let merged = [];
    highlights.forEach((h) => {
      if (!merged.length || h.start > merged[merged.length - 1].end) {
        merged.push(h);
      } else {
        merged[merged.length - 1].end = Math.max(
          merged[merged.length - 1].end,
          h.end
        );
      }
    });

    merged.forEach((h, i) => {
      if (h.start > lastIdx) {
        parts.push(text.slice(lastIdx, h.start));
      }
      parts.push(
        <span
          key={i}
          className="bg-yellow-200 font-semibold px-1 rounded cursor-pointer"
          title="Saved Note"
        >
          {text.slice(h.start, h.end)}
        </span>
      );
      lastIdx = h.end;
    });

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }

    return parts;
  }

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }, 500); // Check every 0.5 sec

    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (!Array.isArray(transcript) || transcript.length === 0) {
      setActiveTranscriptIdx(-1);
      return;
    }

    const idx = transcript.findIndex((seg, i) => {
      const nextStart = transcript[i + 1]?.start ?? Infinity;
      return currentTime >= seg.start && currentTime < nextStart;
    });

    // Fallback to last line if currentTime is beyond all segments
    setActiveTranscriptIdx(
      idx === -1 && currentTime >= transcript[transcript.length - 1]?.start
        ? transcript.length - 1
        : idx
    );
  }, [currentTime, transcript]);

  useEffect(() => {
    const container = transcriptContainerRef.current;
    const activeLine = transcriptRefs.current[activeTranscriptIdx];

    if (container && activeLine && activeTranscriptIdx !== -1) {
      const containerTop = container.getBoundingClientRect().top;
      const lineTop = activeLine.getBoundingClientRect().top;
      const scrollOffset = lineTop - containerTop;

      container.scrollTo({
        top: container.scrollTop + scrollOffset,
        behavior: "smooth",
      });
    }
  }, [activeTranscriptIdx]);

  // Fetch course and progress (completed lessons and quiz results) on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/courses/${courseId}`),
          axios.get(`/api/progress/${userId}/${courseId}`),
        ]);
        setCourseData(courseRes.data);
        setCompletedLessons(progressRes.data.completedLessons || []);
        setQuizResults(progressRes.data.quizResults || []);
        // Flatten lessons for easier navigation
        const flat = flattenItems(courseRes.data.weeks || []);
        setFlatItems(flat);
        setCurrentFlatIdx(0);
      } catch (err) {
        setCompletedLessons([]);
        setQuizResults([]);
        console.error("Error loading course or progress:", err);
      }
    };
    if (userId) fetchData();
  }, [courseId, userId]);

  // Set initial lesson index if provided via navigation (from LearningPath)
  useEffect(() => {
    if (
      location.state &&
      typeof location.state.flatIdx === "number" &&
      flatItems.length > 0
    ) {
      setCurrentFlatIdx(location.state.flatIdx);
    }
    // eslint-disable-next-line
  }, [flatItems, location.state]);

  // Fix: Use flatItems everywhere, not flatLessons, and define currentItemObj at the top of render
  const currentItemObj = flatItems[currentFlatIdx] || {};
  const currentLessonData = currentItemObj.lesson || {};
  // Is current lesson completed?
  const isCompleted =
    currentItemObj.type === "video" && currentLessonData._id
      ? completedLessons.includes(currentLessonData._id)
      : false;

  const getYouTubeId = (url) => {
    if (!url) return "";
    // Accept both full and short YouTube URLs
    const regExp =
      /(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/embed\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : "";
  };

  // Mark lesson as completed (no video tracking)
  const handleMarkAsCompleted = async () => {
    const lessonObj = flatItems[currentFlatIdx]?.lesson;
    if (!lessonObj?._id) return;
    try {
      await axios.post(`/api/progress/complete`, {
        userId,
        courseId,
        lessonId: lessonObj._id,
      });
      setCompletedLessons((prev) => [...prev, lessonObj._id]);
    } catch (err) {
      // Optionally show error
    }
  };

  const handleLessonClick = (flatIdx) => {
    setCurrentFlatIdx(flatIdx);
    setSidebarOpen(false);
    // No need to set currentItemObj manually, it is derived from flatItems[currentFlatIdx]
  };

  // Navigation helpers
  const goPrev = () => setCurrentFlatIdx((idx) => Math.max(0, idx - 1));
  const goNext = () =>
    setCurrentFlatIdx((idx) => Math.min(flatItems.length - 1, idx + 1));

  // Fetch transcript when lesson changes
  useEffect(() => {
    const lessonObj = flatItems[currentFlatIdx];
    // Defensive: lessonObj?.lesson?._id may be undefined for PDFs
    const lessonId = lessonObj?.lesson?._id;
    if (!lessonId) {
      setTranscript([]);
      return;
    }
    setTranscriptLoading(true);
    setTranscript([]);
    setActiveTranscriptIdx(-1);
    // Use the correct endpoint and pass only valid ObjectId
    axios
      .get(`http://localhost:8080/api/transcripts/by-lesson/${lessonId}`)
      .then((res) => {
        if (Array.isArray(res.data.transcript)) {
          setTranscript(res.data.transcript);
        } else {
          setTranscript([]);
        }
      })
      .catch(() => setTranscript([]))
      .finally(() => setTranscriptLoading(false));
  }, [flatItems, currentFlatIdx]);

  // Find active transcript line
  useEffect(() => {
    if (!Array.isArray(transcript) || !transcript.length) {
      setActiveTranscriptIdx(-1);
      return;
    }
    const idx = transcript.findIndex(
      (seg, i) =>
        currentTime >= seg.start &&
        (i === transcript.length - 1 || currentTime < transcript[i + 1].start)
    );
    setActiveTranscriptIdx(idx);
  }, [currentTime, transcript]);

  // Highlight all saved note substrings in transcript (multi-line highlight)

  // Fetch notes for notes tab
  useEffect(() => {
    if (userId && courseId) {
      fetchNotes(userId, courseId).then((res) => setNotes(res.data));
    }
  }, [userId, courseId, savedNotes]);

  // Fetch materials for materials tab
  useEffect(() => {
    if (courseData && courseData.weeks) {
      setMaterialsByModule(getAllMaterialsByModule(courseData.weeks));
    }
  }, [courseData]);

  // --- Add this handler to open PDF in iframe section ---
  const handleOpenPdf = (flatIdx, pdfUrl, resourceName) => {
    setCurrentFlatIdx(flatIdx);
    // Set location.state-like values for PDF display
    window.history.replaceState(
      {
        ...window.history.state,
        pdfUrl,
        isPdf: true,
        resourceName,
        flatIdx,
      },
      ""
    );
  };

  // Quiz progress is now derived from quizResults

  // Handler for opening quiz modal
  const handleQuizClick = (flatIdx, lessonId, locked) => {
    if (locked) return;
    setOpenQuizLessonIdx(flatIdx);
    setQuizModalOpen(true);
  };

  // Handler after quiz is completed
  const handleQuizComplete = (result) => {
    setQuizModalOpen(false);
    setOpenQuizLessonIdx(null);
    // Optionally, refresh progress/quizPassedLessons here
  };

  // --- Sidebar: Render lessons and quizzes with lock logic ---
  // Helper: get quiz pass status for a lessonId
  const getQuizResult = (lessonId) =>
    quizResults.find((q) => q.lessonId === lessonId);

  // Helper: is quiz passed for lessonId
  const isQuizPassed = (lessonId) => {
    const qr = getQuizResult(lessonId);
    return qr && qr.passed;
  };

  // Helper: is lesson locked
  const isLessonLocked = (flatIdx) => {
    if (flatIdx === 0) return false; // First lesson always unlocked
    // Find previous lesson's quiz
    const prevLessonIdx = flatItems
      .slice(0, flatIdx)
      .reverse()
      .find((item) => item.type === "video");
    if (!prevLessonIdx) return false;
    const prevLessonId = prevLessonIdx.lesson?._id;
    return !isQuizPassed(prevLessonId);
  };

  // Helper: is quiz locked
  const isQuizLocked = (lessonId) => {
    // Quiz is locked if lesson is not completed
    return !completedLessons.includes(lessonId);
  };

  if (!courseData || !courseData.weeks)
    return <div className="p-6 text-gray-600">Loading course...</div>;

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

        <div
          className={`fixed lg:static inset-y-0 left-0 z-49 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          style={{ height: "100vh" }}
        >
          <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 break-words max-w-xs">
                {courseData.title}
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Sidebar: Group by week, collapsible */}
            <div className="flex flex-col gap-2 px-2 py-4">
              {courseData.weeks?.map((week, weekIdx) => (
                <div
                  key={weekIdx}
                  className="mb-4 border rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full text-left px-4 py-2 bg-gray-100 font-semibold text-blue-800 flex items-center justify-between focus:outline-none"
                    onClick={() =>
                      setWeekOpen((prev) =>
                        typeof prev === "object"
                          ? { ...prev, [weekIdx]: !prev[weekIdx] }
                          : { [weekIdx]: true }
                      )
                    }
                  >
                    <span>
                      Week {weekIdx + 1}
                      {week.title ? `: ${week.title}` : ""}
                    </span>
                    <span>
                      {(
                        typeof weekOpen === "object"
                          ? weekOpen[weekIdx]
                          : weekOpen
                      )
                        ? "▲"
                        : "▼"}
                    </span>
                  </button>
                  {(typeof weekOpen === "object"
                    ? weekOpen[weekIdx]
                    : weekOpen) && (
                    <div className="py-2">
                      {week.modules?.map((mod, modIdx) => (
                        <div key={modIdx}>
                          {mod.lessons?.map((lesson, lessonIdx) => {
                            const flatIdx = flatItems.findIndex(
                              (fi) =>
                                fi.type === "video" &&
                                fi.lesson?._id === lesson._id
                            );
                            if (flatIdx === -1) return null;
                            const isActive = flatIdx === currentFlatIdx;
                            const locked = isLessonLocked(flatIdx);
                            const completed = completedLessons.includes(
                              lesson._id
                            );
                            const quizResult = getQuizResult(lesson._id);
                            const quizLocked = isQuizLocked(lesson._id);
                            const quizPassed = quizResult && quizResult.passed;
                            return (
                              <div key={lesson._id} className="mb-2">
                                {/* Lesson row */}
                                <button
                                  className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg border transition-colors duration-150
                                    ${
                                      isActive
                                        ? "bg-blue-50 text-blue-700 font-bold border-blue-200"
                                        : "bg-white text-gray-800 border-transparent"
                                    }
                                    ${
                                      locked
                                        ? "opacity-60 cursor-not-allowed"
                                        : "hover:bg-blue-100"
                                    }`}
                                  disabled={locked}
                                  onClick={() =>
                                    !locked && handleLessonClick(flatIdx)
                                  }
                                  title={
                                    locked
                                      ? "Locked. Complete previous quiz."
                                      : lesson.title
                                  }
                                >
                                  <Book className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                  <span className="flex-1 truncate">
                                    {lesson.title}
                                  </span>
                                  {completed && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  {locked && (
                                    <Lock className="w-5 h-5 text-gray-400" />
                                  )}
                                  {isActive && !quizLocked && (
                                    <span className="ml-1 w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                  )}
                                </button>
                                {/* Quiz row */}
                                <div className="pl-8 pr-2 pt-2">
                                  <button
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 rounded-lg border text-sm font-medium transition-colors duration-150
                                      ${
                                        quizLocked
                                          ? "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200"
                                          : "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                                      }
                                      ${quizPassed ? "border-green-400" : ""}
                                      ${
                                        quizResult && !quizPassed
                                          ? "border-red-400"
                                          : ""
                                      }
                                      ${
                                        isActive && quizLocked === false
                                          ? "ring-2 ring-blue-300"
                                          : ""
                                      }`}
                                    disabled={quizLocked}
                                    onClick={() =>
                                      !quizLocked &&
                                      handleQuizClick(
                                        flatIdx,
                                        lesson._id,
                                        quizLocked
                                      )
                                    }
                                    title={
                                      quizLocked
                                        ? "Locked. Complete lesson first."
                                        : quizPassed
                                        ? "Quiz passed"
                                        : "Take quiz"
                                    }
                                  >
                                    <ListChecks className="w-4 h-4 text-yellow-600" />
                                    <span>Quiz</span>
                                    {quizPassed && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    {quizLocked && (
                                      <Lock className="w-4 h-4 text-gray-400" />
                                    )}
                                    {quizResult && !quizPassed && (
                                      <span className="ml-2 text-red-500 font-semibold">
                                        {quizResult.score ?? 0}/100
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                {currentItemObj.title}
              </h1>
              <p className="text-sm text-gray-600">{currentItemObj.duration}</p>
              {/* --- Video or PDF Player --- */}
              <div
                className="relative w-full mt-4 overflow-hidden rounded-lg bg-white"
                style={{ height: "80vh" }}
              >
                {currentItemObj.type === "pdf" ? (
                  <iframe
                    src={getIframePdfUrl(currentItemObj.pdfUrl)}
                    title={
                      currentItemObj.resourceName ||
                      currentItemObj.title ||
                      "PDF Viewer"
                    }
                    className="w-full h-full bg-white"
                    frameBorder="0"
                    allowFullScreen
                    style={{ background: "#fff" }}
                  />
                ) : currentItemObj.videoUrl ? (
                  <div className="absolute inset-0">
                    <YouTube
                      videoId={getYouTubeId(currentItemObj.videoUrl)}
                      className="w-full h-full"
                      iframeClassName="w-full h-full"
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                          modestbranding: 1,
                          rel: 0,
                        },
                      }}
                      onReady={(event) => setPlayer(event.target)}
                      onStateChange={handleStateChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-lg">
                    No video or PDF available for this lesson.
                  </div>
                )}
              </div>

              {/* --- Tabs: Transcript, Notes, Materials --- */}
              <div className="mt-6">
                <div className="flex border-b relative">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      className={`px-6 py-2 font-semibold text-base focus:outline-none ${
                        activeTab === tab.key
                          ? "text-blue-700 border-b-2 border-blue-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === "transcript" && (
                    <div
                      className="border rounded-lg bg-white shadow-inner max-h-[360px] overflow-y-auto relative"
                      ref={transcriptContainerRef}
                    >
                      {/* Sticky Save Note button */}
                      {activeTab === "transcript" &&
                        selectedText &&
                        currentSelection && (
                          <button
                            className="sticky top-0 right-0 float-right m-2 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition"
                            style={{ zIndex: 50 }}
                            onClick={handleSaveNote}
                          >
                            Save Note
                          </button>
                        )}
                      {transcriptLoading ? (
                        <div className="p-4 text-gray-400 text-center">
                          Loading transcript...
                        </div>
                      ) : !Array.isArray(transcript) ||
                        transcript.length === 0 ? (
                        <div className="p-4 text-gray-400 text-center">
                          No transcript available.
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {transcript.map((seg, idx) => (
                            <li
                              key={idx}
                              ref={(el) => (transcriptRefs.current[idx] = el)}
                              onClick={() => {
                                if (player) {
                                  player.seekTo(seg.start, true);
                                }
                              }}
                              className={`px-3 py-2 cursor-pointer transition-all duration-200 relative ${
                                idx === activeTranscriptIdx
                                  ? "text-blue-500 font-semibold bg-blue-50"
                                  : ""
                              }`}
                            >
                              <span className="inline-block w-14 text-xs text-gray-500 mr-2 select-none">
                                {Math.floor(seg.start / 60)
                                  .toString()
                                  .padStart(2, "0")}
                                :
                                {Math.floor(seg.start % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </span>
                              <span
                                className="note-selectable"
                                data-index={idx}
                                style={{ userSelect: "text" }}
                                onMouseUp={(e) =>
                                  handleTextSelection(seg, idx, e)
                                }
                              >
                                {renderTranscriptWithHighlights(seg, idx)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {activeTab === "notes" && (
                    <div className="border rounded-lg bg-white shadow-inner max-h-[360px] overflow-y-auto p-4">
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">
                        Notes
                      </h3>
                      {notes.length === 0 ? (
                        <div className="text-gray-500 italic">
                          No notes saved yet.
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note._id}
                            className="p-3 border mb-2 rounded bg-yellow-50"
                          >
                            <div className="font-semibold text-blue-700">
                              {note.lessonTitle}
                            </div>
                            <div className="text-gray-800 mt-1">
                              {note.noteContent}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {activeTab === "materials" && (
                    <div className="border rounded-lg bg-white shadow-inner max-h-[360px] overflow-y-auto p-4">
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">
                        Materials
                      </h3>
                      {materialsByModule.length === 0 ? (
                        <div className="text-gray-500 italic">
                          No materials uploaded yet.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {materialsByModule.map((mod, idx) => (
                            <div key={idx} className="mb-4">
                              <div className="font-semibold text-blue-800 mb-2">
                                {mod.moduleTitle}
                              </div>
                              <ul className="space-y-2">
                                {mod.pdfs.map((pdf, pdfIdx) => (
                                  <li
                                    key={pdfIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <FileText className="w-5 h-5 text-yellow-600" />
                                    <button
                                      className="font-medium text-left hover:underline text-blue-700"
                                      onClick={() =>
                                        handleOpenPdf(
                                          flatItems.findIndex(
                                            (item) =>
                                              item.type === "pdf" &&
                                              item.weekIdx === pdf.weekIdx &&
                                              item.modIdx === pdf.modIdx &&
                                              item.pdfUrl === pdf.pdfUrl
                                          ),
                                          pdf.pdfUrl,
                                          pdf.pdfName
                                        )
                                      }
                                    >
                                      {pdf.pdfName}
                                    </button>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {pdf.lessonTitle
                                        ? `(from: ${pdf.lessonTitle})`
                                        : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleMarkAsCompleted}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isCompleted
                      ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  disabled={isCompleted}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{isCompleted ? "Completed" : "Mark as Completed"}</span>
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
                    disabled={currentFlatIdx === flatItems.length - 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {currentItemObj.week && currentItemObj.mod && (
                    <>
                      Week {currentItemObj.weekIdx + 1}, Module{" "}
                      {currentItemObj.modIdx + 1}
                      {currentItemObj.type === "video"
                        ? `, Lesson ${currentItemObj.lessonIdx + 1}`
                        : currentItemObj.type === "pdf"
                        ? `, Reading`
                        : ""}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatProvider courseId={courseId}>
        <ChatAssistant courseId={courseId} />
      </ChatProvider>

      {/* ✅ Quiz Modal */}
      {quizModalOpen && openQuizLessonIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <QuizSection
            lessonId={flatItems[openQuizLessonIdx]?.lesson?._id}
            courseId={courseId}
            userId={userId}
            onClose={() => {
              setQuizModalOpen(false);
              setOpenQuizLessonIdx(null);
            }}
            onComplete={async () => {
              try {
                const res = await axios.get(
                  `/api/progress/${userId}/${courseId}`
                );
                setCompletedLessons(res.data.completedLessons || []);
                setQuizResults(res.data.quizResults || []);
              } catch (err) {
                console.error("❌ Failed to refresh progress:", err);
              }
            }}
            goToNextLesson={() =>
              setCurrentFlatIdx((idx) =>
                Math.min(flatItems.length - 1, idx + 1)
              )
            }
            goToCurrentLesson={() => setCurrentFlatIdx((idx) => idx)}
          />
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
