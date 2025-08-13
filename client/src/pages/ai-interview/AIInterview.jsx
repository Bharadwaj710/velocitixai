import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
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

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [cheatCount, setCheatCount] = useState(0);
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

  useEffect(() => {
    if (recording && step === "interview") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 21 && phase === "answering") {
            toast.warn("⏳ Hurry up! Less than 20 seconds left. Answer soon!");
          }

          if (prev <= 1) {
            if (phase === "answering") {
              handleNext(false, true); // timeout
            }
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [recording, step, phase]);

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
        setTimeLeft(QUESTION_TIME);
        timestampsRef.current.push({ question: nextIndex, start: Date.now() });
        startRecording();
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
    resetTranscript();
    SpeechRecognition.stopListening(); // ✅ stop any prior instance
    resetTranscript(); // ✅ reset before new question
    SpeechRecognition.startListening({ continuous: true }); // ✅ fresh start
    const mr = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });
    setMediaRecorder(mr);
    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const fullBlob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(fullBlob);
      SpeechRecognition.stopListening();
      setTranscript((prev) => [...prev, liveTranscript]);
    };

    mr.start();
    setRecording(true);
    timestampsRef.current.push({ question: questionIndex, start: Date.now() });
    setPhase("reading");
    setTimeLeft(READING_TIME);
    toast.info("📖 Reading time started...");

    setTimeout(() => {
      setPhase("answering");
      setTimeLeft(QUESTION_TIME);
      toast.success("🎤 You may now begin answering...");
    }, READING_TIME * 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder?.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const startCheatingDetection = () => {
    const canvas = document.createElement("canvas");
    frameIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("frame", blob);
        try {
          const res = await axios.post(
            "http://localhost:8080/api/aiInterview/check-frame",
            formData
          );
          console.log("Cheating check response:", res.data);
          if (res.data.cheating) {
            if (cheatCount === 0) {
              alert("Warning: Suspicious behavior detected!");
              setCheatCount(1);
            } else if (cheatCount === 1) {
              await axios.post(
                "http://localhost:8080/api/aiInterview/terminate"
              );
              stopRecording();
              clearInterval(timerRef.current);
              clearInterval(frameIntervalRef.current);
              setStep("terminated");
            }
          }
        } catch (err) {
          console.error("Cheating check failed", err);
        }
      }, "image/jpeg");
    }, 1500);
  };

  const handleStart = async () => {
    try {
      if (!courseId) {
        alert("Course ID missing from URL.");
        return;
      }

      const res = await axios.post(
        `http://localhost:8080/api/aiInterview/start-interview?courseId=${courseId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const question = res.data.question;
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);

      setCurrentQuestion(question);
      setStep("interview");
      setQuestionIndex(0);
      setAnswers([]);
      setTimeLeft(QUESTION_TIME);
      startRecording();
      startCheatingDetection();
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
          setTimeLeft(QUESTION_TIME);
          timestampsRef.current.push({
            question: nextIndex,
            start: Date.now(),
          });
          startRecording();
        }
        return;
      }

      // 🧼 Guard: require answer if not skipping
      if (!skip && !fromTimeout && isEmptyAnswer) {
        toast.warn("⚠️ Please answer or skip.");
        return;
      }

      timestampsRef.current[timestampsRef.current.length - 1].end = Date.now();

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
        setTimeLeft(QUESTION_TIME);
        timestampsRef.current.push({ question: nextIndex, start: Date.now() });
        startRecording();
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
    if (!videoBlob) return alert("Video not ready");

    const formData = new FormData();
    formData.append("video", videoBlob, "interview.webm");
    formData.append("answers", JSON.stringify(answers));
    formData.append("timestamps", JSON.stringify(timestampsRef.current));

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
    } catch (err) {
      console.error("Upload failed", err);
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
