import React, { useState } from "react";
import { UploadCloud } from "lucide-react";

const questions = [
  {
    id: 1,
    type: "radio",
    label: "What are your primary interests in a career?",
    options: [
      "Technology and Innovation",
      "Healthcare and Wellness",
      "Business and Finance",
      "Arts and Creativity",
      "Education and Social Services",
    ],
  },
  {
    id: 2,
    type: "text",
    label: "Describe a project you worked on that you are proud of.",
    maxWords: 100,
  },
  {
    id: 3,
    type: "video",
    label: "Record a short video explaining your career aspirations.",
  },
  {
    id: 4,
    type: "text",
    label: "Describe your ideal work environment.",
    maxWords: 100,
  },
  {
    id: 5,
    type: "audio",
    label:
      "Record a short audio clip discussing your strengths and weaknesses.",
  },
];

const Assessments = () => {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (index, val) => {
    setAnswers({ ...answers, [index]: val });
  };

  const handleFileChange = (index, file) => {
    setAnswers({ ...answers, [index]: file });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Submit logic goes here
    setTimeout(() => {
      alert("Assessment submitted!");
      setSubmitting(false);
    }, 1000);
  };

  const completedCount = Object.keys(answers).length;
  const progress = (completedCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Career Assessment
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-10">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300 text-right pr-2 text-white text-sm font-semibold"
            style={{ width: `${progress}%` }}
          >
            {Math.round(progress)}%
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {questions.map((q, index) => (
            <div
              key={index}
              className="bg-gray-50 border p-6 rounded-xl shadow-sm"
            >
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                {index + 1}. {q.label}
              </label>

              {q.type === "radio" && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name={`radio-${index}`}
                        value={opt}
                        checked={answers[index] === opt}
                        onChange={() => handleChange(index, opt)}
                        className="form-radio text-blue-600"
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  rows={4}
                  maxLength={q.maxWords * 6}
                  value={answers[index] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={`Max ${q.maxWords} words`}
                  className="w-full border border-gray-300 rounded-lg p-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              )}

              {(q.type === "video" || q.type === "audio") && (
                <label className="flex flex-col items-start gap-3 mt-2">
                  <span className="flex items-center gap-2 text-blue-600 font-medium">
                    <UploadCloud className="w-5 h-5" />
                    Upload {q.type === "video" ? "Video" : "Audio"}
                  </span>
                  <input
                    type="file"
                    accept={q.type === "video" ? "video/*" : "audio/*"}
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    className="border rounded p-2 bg-white file:bg-blue-600 file:text-white file:rounded file:px-4 file:py-2 cursor-pointer"
                  />
                </label>
              )}
            </div>
          ))}

          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Assessments;
