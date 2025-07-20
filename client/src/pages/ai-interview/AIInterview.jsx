import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { jwtDecode } from "jwt-decode"; // ✅ correct

const QUESTION_TIME = 120;

const AIInterview = () => {
  const { transcript: liveTranscript, resetTranscript } =
    useSpeechRecognition();
  const [step, setStep] = useState("intro");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [cheatCount, setCheatCount] = useState(0);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const timestampsRef = useRef([]);

  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get("courseId");

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
        setTimeLeft((t) => {
          if (t <= 1) {
            handleNext();
            return QUESTION_TIME;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [recording, step]);

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

      setCurrentQuestion(res.data.question);
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

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token); // ✅

    const trimmedAnswer = answers[questionIndex]?.trim();
    const trimmedTranscript = liveTranscript?.trim();

    if (!trimmedAnswer && !trimmedTranscript) {
      alert("Please say your answer before moving to the next question.");
      return;
    }

    if (loadingNextQuestion) return;
    setLoadingNextQuestion(true);

    timestampsRef.current[timestampsRef.current.length - 1].end = Date.now();
    const userAnswer = document.getSelection()?.toString() || "";
    setAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = userAnswer;
      return updated;
    });

    try {
      const res = await axios.post(
        `http://localhost:8080/api/aiInterview/next-question?courseId=${courseId}`,
        {
          answer: answers[questionIndex] || "",
          index: questionIndex,
          transcript: liveTranscript,
          studentId: decoded.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.finished) {
        stopRecording();
        clearInterval(frameIntervalRef.current);
        uploadFinalInterview();
        setStep("complete");
      } else {
        setCurrentQuestion(res.data.question);
        setQuestionIndex((i) => i + 1);
        setTimeLeft(QUESTION_TIME);
        timestampsRef.current.push({
          question: questionIndex + 1,
          start: Date.now(),
        });

        startRecording(); // ✅ Start recording and listening for next question
      }
    } catch (err) {
      alert("Error getting next question.");
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
            <div className="bg-blue-50 rounded-lg p-6 w-full mb-6 text-xl text-blue-900 font-medium text-center shadow">
              {currentQuestion}
            </div>

            {/* Video + Transcript side-by-side */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl mb-6">
              {/* Video */}
              <div className="flex-1">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="rounded-xl w-full bg-black aspect-video shadow-lg"
                />
              </div>

              {/* Transcript */}
              <div className="w-full md:w-1/2 bg-gray-100 p-4 rounded-lg shadow-inner h-[300px] overflow-y-auto">
                <h4 className="font-semibold text-blue-700 mb-2">Transcript</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {liveTranscript}
                </p>
              </div>
            </div>

            {/* Progress + Button */}
            <div className="w-full flex justify-between mb-4 text-gray-600">
              <span>Question {questionIndex + 1}</span>
              <span>
                Time left: <strong>{timeLeft}s</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full mb-6">
              <div
                className="h-3 bg-blue-500 rounded-full transition-all"
                style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
              ></div>
            </div>

            <button
              onClick={handleNext}
              disabled={loadingNextQuestion}
              className={`px-8 py-3 text-white rounded-lg font-semibold text-lg transition ${
                loadingNextQuestion
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {questionIndex === 9
                ? "Finish Interview"
                : loadingNextQuestion
                ? "Loading..."
                : "Next Question"}
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
    </div>
  );
};

export default AIInterview;
