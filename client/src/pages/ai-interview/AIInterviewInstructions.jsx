import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const instructions = [
  "Interview duration: approx 10 minutes",
  "Each question must be answered within 2 minutes",
  "Camera and mic access is required",
  "Avoid distractions or switching tabs",
  "Do not use external help or devices",
];

const AIInterviewInstructions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = new URLSearchParams(location.search).get("courseId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
          AI Interview Instructions
        </h2>
        <ul className="mb-8 w-full text-gray-700 text-base list-disc list-inside">
          {instructions.map((item, idx) => (
            <li key={idx} className="mb-2">
              {item}
            </li>
          ))}
        </ul>
        <button
          className="w-full py-3 mb-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          onClick={() => navigate(`/ai-interview?courseId=${courseId}`)}
        >
          Start Interview
        </button>
        <button
          className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-base hover:bg-gray-300 transition"
          onClick={() => navigate("/student/dashboard")}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AIInterviewInstructions;
