import React, { useEffect, useState } from "react";
import { useParams, useNavigate,useLocation } from "react-router-dom";
import axios from "axios";


const InterviewAnalysis = () => {
  const { courseId } = useParams();
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
const location = useLocation();
const params = new URLSearchParams(location.search);
const isHRView = params.get("view") === "hr";
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/aiInterview/report/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setReport(res.data);
      } catch (err) {
        console.error("Failed to fetch report", err);
      }
    };
    fetchReport();
  }, [courseId]);

  if (!report)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-700">Loading your interview report...</p>
      </div>
    );

  const session = report.sessionDetails || {};

  const getAnswer = (index) => {
    const found = (session.answers || []).find((a) => a.index === index);
    return found ? found.answer : "No answer provided";
  };
const handleReattemptInterview = async () => {
  try {
    const confirm = window.confirm(
      "Are you sure you want to reattempt this interview?"
    );
    if (!confirm) return;

    // Redirect student to AI Interview page for the same course
    navigate(`/ai-interview?courseId=${courseId}`);
  } catch (error) {
    console.error("Error while reattempting interview:", error);
  }
};

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">
        Interview Report — {report.course?.title || "Course"}
      </h2>
{isHRView && (
  <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded">
    <strong>HR View:</strong> This is a read-only report.
  </div>
)}

      {/* Video */}
      <div className="mb-6">
        <video
          src={report.videoUrl}
          controls
          className="w-full rounded-lg shadow-lg"
        />
      </div>

      {/* Overall Scores */}
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Overall Performance
        </h3>
        <ul className="space-y-2">
          {Object.entries(report.overallScores || {}).map(([key, value]) => (
            <li key={key} className="flex justify-between text-gray-700">
              <span className="capitalize">{key}</span>
              <span>{value}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Attempted Questions */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Attempted Questions
      </h3>
      <div className="space-y-4">
        {session.questions?.length > 0 ? (
          session.questions.map((q) => (
            <div key={q.index} className="bg-white border rounded-lg shadow p-4">
              <h4 className="font-bold text-blue-600">
                Q{q.index + 1}: {q.question}
              </h4>
              <p className="text-gray-600 mt-2">
                <strong>Answer:</strong> {getAnswer(q.index)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600 italic">No attempted questions.</p>
        )}
      </div>

      {/* Skipped Questions */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Skipped Questions
        </h3>
        {session.skippedQuestions?.length > 0 ? (
          session.skippedQuestions.map((q, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded border">
              <strong>Q{q.index + 1}:</strong> {q.question}
            </div>
          ))
        ) : (
          <p className="text-gray-600 italic">No skipped questions.</p>
        )}
      </div>

      {/* Not Attempted Questions */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Not Attempted Questions
        </h3>
        {session.notAttemptedQuestions?.length > 0 ? (
          session.notAttemptedQuestions.map((q, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded border">
              <strong>Q{q.index + 1}:</strong> {q.question}
            </div>
          ))
        ) : (
          <p className="text-gray-600 italic">No unattempted questions.</p>
        )}
      </div>

      {/* Cheating Info */}
      <div className="mt-8 bg-red-50 p-4 rounded-lg border border-red-300">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Cheating Detection Summary
        </h3>
        <p>
          <strong>Status:</strong>{" "}
          {session.cheatingDetected ? "Detected ⚠️" : "No cheating detected ✅"}
        </p>
        <p>
          <strong>Warnings:</strong>{" "}
          {session.cheatingWarning ? "Yes" : "No"}
        </p>
        <p>
          <strong>Attempts Left:</strong> {session.cheatingAttempts}
        </p>
      </div>

      {/* Reattempt Button */}
      <div className="mt-10 text-center">
        {!isHRView && (
  <button
    onClick={handleReattemptInterview}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
  >
    Reattempt Interview
  </button>
)}
      </div>
    </div>
  );
};

export default InterviewAnalysis;
