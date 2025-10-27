import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { jwtDecode } from "jwt-decode"; // ✅ correct
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QUESTION_TIME = 120;
const READING_TIME = 20;

const AIInterview = () => {
  const { transcript: liveTranscript, resetTranscript } =
    useSpeechRecognition();
  const [step, setStep] = useState("intro");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState("reading"); // "reading" | "answering"
  const token = localStorage.getItem("token");
  const [terminated, setTerminated] = useState(false);
  const [cheatingMessage, setCheatingMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [recording, setRecording] = useState(false);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [questions, setQuestions] = useState([]); // 💡 store all questions
  const [skipped, setSkipped] = useState([]); // 💡 index of skipped questions
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const timestampsRef = useRef([]);
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get("courseId");
  const [skipDisabled, setSkipDisabled] = useState(false);
  const timedOutTriggeredRef = useRef(false);
  const [transcript, setTranscript] = useState([]);
  const lastWarningRef = useRef(0); // for cooldown
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [warningMessage, setWarningMessage] = useState("");
  const mediaRecorderRef = useRef(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportId, setReportId] = useState(null);

  const navigate = useNavigate();

  const pollForReport = async (reportId) => {
    let attempts = 0;
    const token = localStorage.getItem("token");

    const interval = setInterval(async () => {
      attempts++;
      console.log(`🔍 Checking analysis report... attempt ${attempts}`);

      try {
        const res = await axios.get(
          `http://localhost:8080/api/aiInterview/report/${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data && res.data._id) {
          clearInterval(interval);
          console.log("✅ Report ready:", res.data._id);
          setAnalyzing(false);
          navigate(`/ai-interview-analysis/${courseId}`);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("Report not ready yet...");
        } else {
          console.error("Polling error:", err.message);
        }
      }

      if (attempts > 12) {
        clearInterval(interval);
        toast.error(
          "Analysis taking longer than expected. Please check later."
        );
        navigate("/student/dashboard");
      }
    }, 5000);
  };
  // NEW: keep a ref copy of current phase to avoid stale closures in interval
  const phaseRef = useRef(phase);

useEffect(() => {
  const checkIfCompleted = async () => {
    if (!courseId) return;
    try {
      const res = await axios.get(
        `http://localhost:8080/api/aiInterview/report/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data && res.data._id) {
        setStep("completed-report");
      }
    } catch {
      // not completed yet
    }
  };
  checkIfCompleted();
}, [courseId]);

  useEffect(() => {
    async function getWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      } catch (err) {
        alert("Failed to access webcam. Please allow camera/mic.");
      }
    }
    getWebcam();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      clearInterval(frameIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === "interview" && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, [step]);

  // --- helper: start phase timer ---
  const startPhaseTimer = (phaseType) => {
    // sync states and refs
    setPhase(phaseType);
    phaseRef.current = phaseType;
    setTimeLeft(phaseType === "reading" ? READING_TIME : QUESTION_TIME);

    // clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // start centralized countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;

        // reading -> answering transition
        if (next <= 0 && phaseRef.current === "reading") {
          // switch to answering
          phaseRef.current = "answering";
          setPhase("answering");
          // start speech recognition safely
          try {
            SpeechRecognition.startListening({ continuous: true });
          } catch {}
          resetTranscript();
          // set answering time and continue countdown next tick
          return QUESTION_TIME;
        }

        // answering timeout -> call handleNext once and stop timer
        if (next <= 0 && phaseRef.current === "answering") {
          try {
            SpeechRecognition.stopListening();
          } catch {}
          clearInterval(timerRef.current);
          timerRef.current = null;
          // call handleNext (timeout)
          setTimeout(() => handleNext(false, true), 0);
          return 0;
        }

        // warning toast when entering last 20s of answering
        if (phaseRef.current === "answering" && next === 20) {
          toast.warn("⏳ Hurry up! Less than 20 seconds left to answer!");
        }

        return next;
      });
    }, 1000);
  };

  const handleSkip = async (timedOut = false) => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);

    setSkipped((prev) =>
      prev.includes(questionIndex) ? prev : [...prev, questionIndex]
    );

    setAnswers((prev) => {
      const exists = prev.find((a) => a.index === questionIndex);
      return exists ? prev : [...prev, { index: questionIndex, answer: "" }];
    });

    if (timestampsRef.current.length > 0) {
      timestampsRef.current[timestampsRef.current.length - 1].end = Date.now();
    }

    try {
      await axios.post(
        "http://localhost:8080/api/aiInterview/save-answer",
        {
          question: currentQuestion,
          answer: "",
          transcript: "",
          index: questionIndex,
          studentId: decoded.userId,
          skip: true,
          timedOut,
          courseId: courseId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const res = await axios.post(
        `http://localhost:8080/api/aiInterview/next-question?courseId=${courseId}`,
        {
          answer: "",
          question: currentQuestion,
          transcript: "",
          studentId: decoded.userId,
          skip: true,
          timedOut,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.finished) {
        stopRecording();
        clearInterval(frameIntervalRef.current);
        uploadFinalInterview();
        setStep("complete");
      } else {
        const nextIndex = res.data.isRevisit
          ? res.data.revisitIndex
          : res.data.index ?? questionIndex + 1;

        setCurrentQuestion(res.data.question);
        setQuestionIndex(nextIndex);
        setSkipDisabled(!!res.data.disableSkip); // ✅ disable on revisit

        // NEW: start the READING phase for the new question (20s) and reset transcript
        resetTranscript();
        startPhaseTimer("reading");

        timestampsRef.current.push({ question: nextIndex, start: Date.now() });
      }
    } catch (err) {
      console.error(
        "❌ Error in handleSkip:",
        err?.response?.data || err.message
      );
      toast.error("❌ Failed to skip question.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const mr = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
    });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const fullBlob = new Blob(chunksRef.current, { type: "video/webm" });
      console.log("🎥 Final interview blob created:", fullBlob);
      setVideoBlob(fullBlob);
    };

    mr.start();
    setRecording(true);
  };

  const uploadTerminatedInterview = async (finalBlob) => {
    if (!finalBlob) {
      console.error("❌ No video blob available to upload for termination.");
      return;
    }

    const formData = new FormData();
    formData.append("video", finalBlob, "terminated.webm");
    formData.append("answers", JSON.stringify(answers));
    formData.append("timestamps", JSON.stringify(timestampsRef.current));
    formData.append("questions", JSON.stringify(questions));

    try {
      const res = await axios.post(
        "http://localhost:8080/api/aiInterview/terminate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("✅ Terminated interview uploaded:", res.data);

      const reportId = res.data?.reportId || res.data?.sessionId;
      if (reportId) {
        setAnalyzing(true);
        setStep("analyzing"); // ✅ Show analyzing screen immediately
        pollForReport(reportId);
      } else {
        console.warn("⚠️ No reportId returned from backend, cannot poll.");
      }
    } catch (err) {
      console.error("❌ Terminated upload failed:", err.response?.data || err);
    }
  };
  const stopRecording = async (isTerminated = false) => {
    return new Promise((resolve) => {
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.onstop = async () => {
            const fullBlob = new Blob(chunksRef.current, {
              type: "video/webm",
            });
            setVideoBlob(fullBlob);
            console.log("🎥 Recording stopped. Final blob ready:", fullBlob);

            if (isTerminated) {
              await uploadTerminatedInterview(fullBlob);
            }
            resolve();
          };
          mediaRecorderRef.current.stop();
        } else {
          resolve();
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      } catch (err) {
        console.error("Error stopping recording:", err);
        resolve();
      }
    });
  };

  const processingRef = useRef(false);

  const WARNING_COOLDOWN_MS = 6000;

  const startCheatingDetection = () => {
    const canvas = document.createElement("canvas");
    frameIntervalRef.current = setInterval(async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          processingRef.current = false;
          return;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.7)
        );
        if (!blob) {
          processingRef.current = false;
          return;
        }

        const formData = new FormData();
        formData.append("frame", blob);

        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:8080/api/aiInterview/check-frame",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            timeout: 8000,
          }
        );

        const data = res.data || {};
        console.debug("Cheat detector response:", data);

        // Update attempts safely
        const attemptsFromServer =
          typeof data.cheatingAttempts === "number"
            ? data.cheatingAttempts
            : remainingAttempts;
        setRemainingAttempts(attemptsFromServer);

        // Calibration mode → no penalties
        if (!data.baseline_ready && data.status !== "terminated") {
          setWarningMessage("Calibrating... please keep your face steady");
          processingRef.current = false;
          return;
        }

        // If backend says terminated (only for critical cases like no face too long / multiple faces)
        if (
          data.status === "terminated" ||
          (typeof data.cheatingAttempts === "number" &&
            data.cheatingAttempts <= 0)
        ) {
          toast.error(
            "Interview terminated due to repeated critical violations."
          );
          clearInterval(timerRef.current);
          clearInterval(frameIntervalRef.current);
          setWarningMessage(
            "Interview terminated due to repeated critical violations."
          );

          await stopRecording(true); // ✅ waits for video blob and uploads
          setStep("terminated");
          processingRef.current = false;
          return;
        }

        // ✅ Handle warnings (head tilt / turn etc.)
        if (Array.isArray(data.reasons) && data.reasons.length > 0) {
          const now = Date.now();
          if (
            !lastWarningRef.current ||
            now - lastWarningRef.current > WARNING_COOLDOWN_MS
          ) {
            // remove angle values if included
            const cleanReasons = data.reasons.map((r) =>
              r.replace(/\(.*?\)/g, "").trim()
            );

            const message = `⚠️ ${cleanReasons.join(
              " | "
            )} — please face the camera.`;
            setWarningMessage(message);
            toast.warn(message, {
              style: { background: "yellow", color: "black" },
            });
            lastWarningRef.current = now;
          }
        } else {
          // no warnings → clear
          setWarningMessage("");
        }

        // ✅ Handle critical events (red toast, still attempt decrement handled by backend)
        if (Array.isArray(data.critical) && data.critical.length > 0) {
          const msg = `❌ ${data.critical.join(
            " | "
          )}. Attempts left: ${attemptsFromServer}`;
          toast.error(msg, { style: { background: "red", color: "white" } });
          setWarningMessage(msg);
        }
      } catch (err) {
        console.error(
          "Cheating detection error:",
          err?.response?.data || err.message
        );
      } finally {
        processingRef.current = false;
      }
    }, 1000); // still runs every 1.5s, but no-face detection gap shortened in backend
  };

  const handleStart = async () => {
    try {
      if (!courseId) {
        alert("Course ID missing from URL.");
        return;
      }
      // Reset local states before starting
      setRemainingAttempts(3);
      setWarningMessage("");
      setTerminated(false);
      setSkipped([]);
      setAnswers([]);
      setTranscript([]);
      setLoadingNextQuestion(false);

      const res = await axios.post(
        `http://localhost:8080/api/aiInterview/start-interview?courseId=${courseId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
timestampsRef.current = [{ question: 0, start: Date.now() }];

      const question = res.data.question;
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);

      setCurrentQuestion(question);
      setStep("interview");
      setQuestionIndex(0);
      setAnswers([]);
      // 🎥 Start recording once — will continue till interview ends or terminates
      startRecording();
      startCheatingDetection();
      // 🕒 Start first reading phase (20s)
      startPhaseTimer("reading");
    } catch (err) {
      alert("Failed to start interview.");
      console.error(err);
    }
  };

  const handleNext = async (skip = false, fromTimeout = false) => {
    if (loadingNextQuestion) return;
    setLoadingNextQuestion(true);

    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const index = questionIndex;

    const finalAnswer = fromTimeout || skip ? "" : liveTranscript?.trim() || "";
    const isEmptyAnswer = !finalAnswer;

    try {
      // ✅ Detect revisit with no answer (treat as timedOut)
      const isRevisitNoAnswer =
        skipDisabled && !skip && !fromTimeout && isEmptyAnswer;

      // 🕒 TIMEOUT FLOW (normal or revisit-no-answer)
      if ((fromTimeout && isEmptyAnswer) || isRevisitNoAnswer) {
        if (timedOutTriggeredRef.current) return;
        timedOutTriggeredRef.current = true;

        timestampsRef.current[timestampsRef.current.length - 1].end =
          Date.now();

        const res = await axios.post(
          `http://localhost:8080/api/aiInterview/next-question?courseId=${courseId}`,
          {
            answer: "",
            question: currentQuestion,
            transcript: "",
            studentId: decoded.userId,
            skip: false,
            timedOut: true, // ✅ will be true for revisit no answer as well
            courseId: courseId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        timedOutTriggeredRef.current = false;

        if (res.data.finished) {
          stopRecording();
          clearInterval(frameIntervalRef.current);
          uploadFinalInterview();
          setStep("complete");
        } else {
          const nextIndex = res.data.isRevisit
            ? res.data.revisitIndex
            : res.data.index ?? questionIndex + 1;

          setCurrentQuestion(res.data.question);
          setQuestionIndex(nextIndex);
          setSkipDisabled(!!res.data.disableSkip);

          // FIX: start READING phase for the next question instead of jumping to answering
          resetTranscript();
          startPhaseTimer("reading");

          timestampsRef.current.push({
            question: nextIndex,
            start: Date.now(),
          });
        }
        return;
      }

      // 🧼 Guard: require answer if not skipping
      if (!skip && !fromTimeout && isEmptyAnswer) {
        toast.warn("⚠️ Please answer or skip.");
        return;
      }

     if (timestampsRef.current.length > 0) {
  timestampsRef.current[timestampsRef.current.length - 1].end = Date.now();
}


      // ✅ Save answer or skip
      await axios.post(
        "http://localhost:8080/api/aiInterview/save-answer",
        {
          answer: skip ? "" : finalAnswer,
          question: currentQuestion,
          transcript: skip ? "" : finalAnswer,
          index,
          studentId: decoded.userId,
          timedOut: false,
          skip,
          courseId: courseId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSkipped((prev) => prev.filter((i) => i !== questionIndex));

      // ✅ Fetch next question
      const res = await axios.post(
        `http://localhost:8080/api/aiInterview/next-question?courseId=${courseId}`,
        {
          answer: skip ? "" : finalAnswer,
          question: currentQuestion,
          transcript: skip ? "" : finalAnswer,
          studentId: decoded.userId,
          skip,
          timedOut: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.finished) {
        stopRecording();
        clearInterval(frameIntervalRef.current);
        uploadFinalInterview();
        setStep("complete");
      } else {
        const nextIndex = res.data.isRevisit
          ? res.data.revisitIndex
          : res.data.index ?? questionIndex + 1;

        setCurrentQuestion(res.data.question);
        setQuestionIndex(nextIndex);
        setSkipDisabled(!!res.data.disableSkip);

        // FIX: start READING phase for the next question (20s) and reset transcript
        resetTranscript();
        startPhaseTimer("reading");

        timestampsRef.current.push({ question: nextIndex, start: Date.now() });
      }
    } catch (err) {
      console.error(
        "❌ Error in handleNext:",
        err?.response?.data || err.message
      );
      toast.error("❌ Failed to fetch next question.");
    } finally {
      setLoadingNextQuestion(false);
    }
  };

  const uploadFinalInterview = async () => {
    if (!videoBlob) {
      console.log("⏳ Waiting for videoBlob...");
      setTimeout(uploadFinalInterview, 500); // retry until blob ready
      return;
    }
    const formData = new FormData();
    formData.append("video", videoBlob, "interview.webm");
    formData.append("answers", JSON.stringify(answers));
    formData.append("timestamps", JSON.stringify(timestampsRef.current));
    formData.append("questions", JSON.stringify(questions)); // ✅ add this

    try {
      const res = await axios.post(
        "http://localhost:8080/api/aiInterview/complete-interview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Interview complete:", res.data);
      setAnalyzing(true);
      setStep("analyzing");
      pollForReport();
    } catch (err) {
      console.error("Upload failed", err.response?.data || err);
      alert("Failed to upload interview.");
    }
  };
  const trimmedTranscript = liveTranscript?.trim() || "";
  const isEmptyAnswer = !trimmedTranscript;
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-700">AI Interview</h2>

        {step === "intro" && (
          <>
            <p className="mb-8 text-lg text-gray-700 text-center">
              You will answer 10 AI-generated interview questions on camera.
              Suspicious behavior will terminate the interview. Click Start when
              you're ready.
            </p>
            <div className="rounded-xl w-full max-w-3xl mb-6 bg-black aspect-video shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
            >
              Start Interview
            </button>
          </>
        )}

        {step === "interview" && (
          <>
            {/* Question */}
            <div className="bg-blue-50 rounded-lg px-6 py-4 mb-6 text-xl text-blue-900 font-medium text-center shadow min-h-[90px] w-full max-w-5xl mx-auto">
              {currentQuestion}
              {skipped.includes(questionIndex) && (
                <span className="ml-2 text-yellow-600 text-sm">
                  (⏭ Skipped Question)
                </span>
              )}
            </div>

            {/* Video + Transcript side-by-side */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl mb-6">
              {/* Video */}
              <div className="w-full flex flex-col md:flex-row gap-6 mb-6">
                {/* Video Section - Wider */}
                <div className="md:w-2/3 w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="rounded-xl w-full bg-black aspect-video shadow-lg"
                  />
                </div>

                {/* Transcript Section - Right Side */}
                <div className="md:w-1/3 w-full bg-gray-100 p-4 rounded-lg shadow-inner h-[300px] overflow-y-auto">
                  <h4 className="font-semibold text-blue-700 mb-2">
                    Transcript
                  </h4>
                  {phase === "reading" ? (
                    <p className="text-sm text-gray-400 italic">
                      Reading time... transcript disabled
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 whitespace-pre-line">
                      {liveTranscript}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Warning & Attempts */}
            {warningMessage && (
              <div className="w-full max-w-5xl mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-semibold">
                {warningMessage}
              </div>
            )}

            <p className="text-gray-700 mb-4">
              Attempts: <strong>{remainingAttempts}</strong>
            </p>

            {/* Progress + Button */}
            <div className="w-full flex justify-between mb-4 text-gray-600">
              <span>Question {questionIndex + 1}</span>
              <span>
                Time left: <strong>{timeLeft}s</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  phase === "reading"
                    ? "bg-yellow-400"
                    : timeLeft <= 20
                    ? "bg-red-600"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${
                    (timeLeft /
                      (phase === "reading" ? READING_TIME : QUESTION_TIME)) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <button
              onClick={() => handleSkip()}
              disabled={phase === "reading" || skipDisabled || timeLeft > 60}
              className={`ml-4 px-8 py-3 text-white rounded-lg font-semibold text-lg transition ${
                phase === "reading" || skipDisabled || timeLeft > 60
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              Skip
            </button>

            <button
              onClick={() => handleNext()}
              disabled={
                loadingNextQuestion || isEmptyAnswer || phase === "reading"
              }
              className={`px-8 py-3 text-white rounded-lg font-semibold text-lg transition ${
                loadingNextQuestion || isEmptyAnswer || phase === "reading"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {(() => {
                // Condition 1: No skipped questions and last question
                const isLastNormalQuestion =
                  skipped.length === 0 && questionIndex === 9;

                // Condition 2: Revisiting the final skipped question
                const isFinalRevisit =
                  skipDisabled &&
                  skipped.length === 1 &&
                  skipped[0] === questionIndex;

                if (isLastNormalQuestion || isFinalRevisit) {
                  return "Finish Interview";
                }
                return loadingNextQuestion ? "Loading..." : "Next Question";
              })()}
            </button>
          </>
        )}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mb-6"></div>
            <h3 className="text-2xl font-bold text-blue-700 mb-2">
              Analyzing your interview...
            </h3>
            <p className="text-gray-600 text-center">
              Please wait while we process your video and generate your report.
            </p>
          </div>
        )}
        {step === "complete" && (
          <div className="text-center py-24">
            <h3 className="text-2xl font-bold text-blue-700 mb-4">
              Interview Submitted!
            </h3>
            <p className="text-gray-700">
              Your responses and video have been submitted for analysis.
            </p>
          </div>
        )}

        {step === "terminated" && (
          <div className="text-center py-24 text-red-600">
            <h3 className="text-2xl font-bold mb-4">Interview Terminated</h3>
            <p>
              Multiple cheating attempts were detected. Your interview has
              ended.
            </p>
          </div>
        )}
      </div>

      {/* Add ToastContainer for toasts */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AIInterview;
