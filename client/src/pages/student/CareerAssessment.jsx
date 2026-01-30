import React, { useState, useRef, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";

const DOMAIN_OPTIONS = [
  "Technology and Innovation",
  "Healthcare and Wellness",
  "Business and Finance",
  "Arts and Creativity",
  "Education and Social Services",
];

const DOMAIN_QUESTIONS = {
  "Technology and Innovation": [
    {
      questionNumber: 2,
      questionText: "What motivates you to pursue a career in technology and innovation?",
      questionType: "paragraph",
    },
    {
      questionNumber: 3,
      questionText: "List the programming languages or tech tools you’ve used.",
      questionType: "text",
    },
    {
      questionNumber: 4,
      questionText:
        "Describe a tech project you’ve built or would like to build.",
      questionType: "paragraph",
    },
    {
      questionNumber: 5,
      questionText: "Which of the following topics are you interested in?",
      questionType: "checkbox",
      options: ["AI", "Web Dev", "Cybersecurity", "Cloud", "IoT"],
    },
    {
      questionNumber: 6,
      questionText: "What is your preferred project type or learning activity in this domain?",
      questionType: "mcq",
      options: ["Build a project", "Case studies", "Group work", "Reading", "Other"],
    },
    {
      questionNumber: 7,
      questionText: "What kind of technical job role would you like to pursue?",
      questionType: "text",
    },
    {
      questionNumber: 8,
      questionText:
        "What challenges do you face while learning or building in tech?",
      questionType: "paragraph",
    },
  ],
  "Healthcare and Wellness": [
    {
      questionNumber: 2,
      questionText: "What motivates you to pursue a career in healthcare and wellness?",
      questionType: "paragraph",
    },
    {
      questionNumber: 3,
      questionText:
        "What areas or subjects have you studied or worked in within healthcare?",
      questionType: "text",
    },
    {
      questionNumber: 4,
      questionText:
        "Describe why you want to work in the healthcare or wellness sector.",
      questionType: "paragraph",
    },
    {
      questionNumber: 5,
      questionText: "Which sub-fields interest you?",
      questionType: "checkbox",
      options: [
        "Nutrition",
        "Mental Health",
        "Nursing",
        "Diagnostics",
        "Public Health",
      ],
    },
    {
      questionNumber: 6,
      questionText: "What is your preferred project type or learning activity in this domain?",
      questionType: "mcq",
      options: ["Clinical project", "Research", "Community work", "Reading", "Other"],
    },
    {
      questionNumber: 7,
      questionText: "What healthcare role would you like to pursue?",
      questionType: "text",
    },
    {
      questionNumber: 8,
      questionText: "What challenges or gaps do you feel in this field?",
      questionType: "paragraph",
    },
  ],
  "Business and Finance": [
    {
      questionNumber: 2,
      questionText: "What motivates you to pursue a career in business and finance?",
      questionType: "paragraph",
    },
    {
      questionNumber: 3,
      questionText:
        "What tools or platforms (e.g., Excel, CRM) have you used in business settings?",
      questionType: "text",
    },
    {
      questionNumber: 4,
      questionText:
        "Describe a business idea or project you’ve worked on or want to pursue.",
      questionType: "paragraph",
    },
    {
      questionNumber: 5,
      questionText: "Which domains are you interested in?",
      questionType: "checkbox",
      options: [
        "Marketing",
        "Finance",
        "Entrepreneurship",
        "Analytics",
        "Strategy",
      ],
    },
    {
      questionNumber: 6,
      questionText: "What is your preferred project type or learning activity in this domain?",
      questionType: "mcq",
      options: ["Case studies", "Projects", "Group tasks", "Lectures", "Other"],
    },
    {
      questionNumber: 7,
      questionText: "What business role would you like to aim for?",
      questionType: "text",
    },
    {
      questionNumber: 8,
      questionText:
        "What challenges do you face in business-related learning or problem-solving?",
      questionType: "paragraph",
    },
  ],
  "Arts and Creativity": [
    {
      questionNumber: 2,
      questionText: "What motivates you to pursue a career in arts and creativity?",
      questionType: "paragraph",
    },
    {
      questionNumber: 3,
      questionText: "What tools/software do you use for creative work?",
      questionType: "text",
    },
    {
      questionNumber: 4,
      questionText: "Describe a creative project you've done or hope to do.",
      questionType: "paragraph",
    },
    {
      questionNumber: 5,
      questionText:
        "Which creative skills are you familiar with or interested in?",
      questionType: "checkbox",
      options: [
        "Design",
        "Music",
        "Filmmaking",
        "Writing",
        "Animation",
        "Editing",
      ],
    },
    {
      questionNumber: 6,
      questionText: "What is your preferred project type or learning activity in this domain?",
      questionType: "mcq",
      options: ["Tutorials", "Practice", "Collaboration", "Feedback", "Other"],
    },
    {
      questionNumber: 7,
      questionText:
        "What kind of creative job or role do you dream of pursuing?",
      questionType: "text",
    },
    {
      questionNumber: 8,
      questionText:
        "What are the biggest learning or creative challenges you face?",
      questionType: "paragraph",
    },
  ],
  "Education and Social Services": [
    {
      questionNumber: 2,
      questionText: "What motivates you to pursue a career in education and social services?",
      questionType: "paragraph",
    },
    {
      questionNumber: 3,
      questionText:
        "What topics or causes do you care deeply about educating or supporting?",
      questionType: "text",
    },
    {
      questionNumber: 4,
      questionText:
        "Describe any teaching, volunteering, or outreach work you've done or hope to do.",
      questionType: "paragraph",
    },
    {
      questionNumber: 5,
      questionText: "Which areas interest you most?",
      questionType: "checkbox",
      options: [
        "Curriculum Design",
        "Counselling",
        "Digital Literacy",
        "Rural Education",
        "NGO Work",
      ],
    },
    {
      questionNumber: 6,
      questionText: "What is your preferred project type or learning activity in this domain?",
      questionType: "mcq",
      options: ["Roleplay", "Peer mentoring", "Webinars", "Field work", "Other"],
    },
    {
      questionNumber: 7,
      questionText: "What specific role would you like to grow into?",
      questionType: "text",
    },
    {
      questionNumber: 8,
      questionText:
        "What are your biggest challenges in communication, empathy, or impact delivery?",
      questionType: "paragraph",
    },
  ],
};

const COMMON_Q1 = {
  questionNumber: 1,
  questionText: "Which career domain are you most interested in?",
  questionType: "mcq",
  options: DOMAIN_OPTIONS,
};

const COMMON_Q9 = {
  questionNumber: 9,
  questionText:
    "How many hours per week can you dedicate to skill development?",
  questionType: "mcq",
  options: ["<2 hours", "2–5 hours", "6–10 hours", "10+ hours"],
};

const COMMON_Q10 = {
  questionNumber: 10,
  questionText:
    "Upload a 1-minute video or audio introducing yourself and your career goal.",
  questionType: "file",
};

const getInstructions = (question) => {
  if (!question) return null;
  if (question.questionType === "paragraph")
    return "Your answer should be at least 150 words. Be specific.";
  if (question.questionType === "text")
    return "Keep your response clear and concise.";
  if (question.questionType === "file")
    return "Upload a 1-minute video or audio clip. Max size: 50MB. Accepted formats: mp4, mp3, webm, wav.";
  return null;
};

const CareerAssessment = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;
  const navigate = useNavigate();

  const [domain, setDomain] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef();

  // Always include placeholders for full 10-question form
  let questions = [COMMON_Q1];

  if (domain && DOMAIN_QUESTIONS[domain]) {
    questions = [COMMON_Q1, ...DOMAIN_QUESTIONS[domain], COMMON_Q9, COMMON_Q10];
  } else {
    // Fill with placeholder questions (hidden or disabled if needed)
    questions = Array.from({ length: 10 }, (_, i) => ({
      questionNumber: i + 1,
      questionText:
        i === 0
          ? COMMON_Q1.questionText
          : `Please select a domain to load question ${i + 1}`,
      questionType: i === 0 ? "mcq" : "text", // Just keep them fill-safe
      options: i === 0 ? COMMON_Q1.options : [],
    }));
  }

  useEffect(() => {
    setAnswers(
      questions.map((q, idx) =>
        answers[idx] && answers[idx].questionNumber === q.questionNumber
          ? answers[idx]
          : {
              questionNumber: q.questionNumber,
              questionText: q.questionText,
              questionType: q.questionType,
              answer: q.questionType === "checkbox" ? [] : "",
            }
      )
    );
    // eslint-disable-next-line
  }, [domain]);

  const handleInputChange = (e, qIdx) => {
    const q = questions[qIdx];
    let value = e.target.value;
    if (q.questionType === "checkbox") {
      const checked = e.target.checked;
      const option = e.target.name;
      setAnswers((prev) => {
        const updated = [...prev];
        let arr = updated[qIdx].answer || [];
        arr = checked ? [...arr, option] : arr.filter((v) => v !== option);
        updated[qIdx] = { ...updated[qIdx], answer: arr };
        return updated;
      });
    } else {
      setAnswers((prev) => {
        const updated = [...prev];
        updated[qIdx] = { ...updated[qIdx], answer: value };
        return updated;
      });
      if (q.questionNumber === 1) {
        setDomain(value);
      }
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setAnswers((prev) => {
      const updated = [...prev];
      updated[questions.length - 1] = {
        ...updated[questions.length - 1],
        answer: selected.name,
      };
      return updated;
    });
  };

  const preventCopyPaste = (e) => e.preventDefault();

  const handleNext = () => {
    const curr = answers[currentQuestionIndex];
    const isAnswered =
      curr &&
      (Array.isArray(curr.answer)
        ? curr.answer.length > 0
        : curr.answer !== "");

    if (!isAnswered) {
      setErrorMsg("Please answer the current question before proceeding.");
      return;
    }

    setErrorMsg("");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allAnswered = answers.every((a) =>
      Array.isArray(a.answer) ? a.answer.length > 0 : a.answer !== ""
    );

    if (!allAnswered || !file) {
      setErrorMsg("Please answer all questions and upload the required file.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("domain", domain);
      const answersToSend = answers.map((a) =>
        a.questionType === "file" ? { ...a, answer: "" } : a
      );
      formData.append("answers", JSON.stringify(answersToSend));
      if (file) formData.append("file", file);

      await apiClient.post("/api/assessments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Assessment submitted successfully!");
      setSubmitting(false);
      setCurrentQuestionIndex(0);
      setDomain("");
      setAnswers([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Redirect to student courses page after successful submit
      setTimeout(() => {
        navigate("/student/courses");
      }, 800);
    } catch (err) {
      setErrorMsg("Failed to submit assessment. Try again.");
      setSubmitting(false);
    }
  };

  const TOTAL_QUESTIONS = 10;
  const answeredCount = answers.filter(
    (a) =>
      a &&
      a.answer &&
      (Array.isArray(a.answer) ? a.answer.length > 0 : a.answer !== "")
  ).length;

  const progress = (answeredCount / TOTAL_QUESTIONS) * 100;

  const q = questions[currentQuestionIndex];
  const qIdx = currentQuestionIndex;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-2">
      <div className="w-full max-w-xl transition-all duration-300 p-6 bg-white shadow-lg rounded-2xl flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Career Assessment
        </h2>

        {domain && (
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">
                Question {qIdx + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {
                  answers.filter(
                    (a) =>
                      a &&
                      a.answer &&
                      (Array.isArray(a.answer)
                        ? a.answer.length
                        : a.answer !== "")
                  ).length
                }
                /{questions.length} answered
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <form
          className="w-full flex flex-col gap-6 transition-opacity duration-300"
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
        >
          <div className="transition-all duration-300 p-6 bg-gray-50 shadow rounded-xl w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {q.questionText}
            </label>

            {q.questionType === "mcq" && (
              <div className="flex flex-col gap-2 mt-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q${q.questionNumber}`}
                      value={opt}
                      checked={answers[qIdx]?.answer === opt}
                      onChange={(e) => handleInputChange(e, qIdx)}
                      className="form-radio text-blue-600 focus:ring-blue-500 transition-all duration-200"
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.questionType === "checkbox" && (
              <div className="flex flex-col gap-2 mt-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name={opt}
                      checked={answers[qIdx]?.answer?.includes(opt) || false}
                      onChange={(e) => handleInputChange(e, qIdx)}
                      className="form-checkbox text-purple-600 focus:ring-purple-500 transition-all duration-200"
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.questionType === "text" && (
              <input
                type="text"
                name={`q${q.questionNumber}`}
                value={answers[qIdx]?.answer || ""}
                onChange={(e) => handleInputChange(e, qIdx)}
                onCopy={preventCopyPaste}
                onPaste={preventCopyPaste}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                placeholder="Type your answer..."
              />
            )}

            {q.questionType === "paragraph" && (
              <textarea
                name={`q${q.questionNumber}`}
                value={answers[qIdx]?.answer || ""}
                onChange={(e) => handleInputChange(e, qIdx)}
                onCopy={preventCopyPaste}
                onPaste={preventCopyPaste}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all min-h-[120px] resize-none"
                placeholder="Write your detailed answer..."
              />
            )}

            {q.questionType === "file" && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="file"
                  accept=".mp4,.mp3,.webm,.wav"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-pink-500 file:text-white hover:file:from-blue-600 hover:file:to-pink-600 transition-all duration-200"
                />
                {answers[qIdx]?.answer && (
                  <span className="text-xs text-gray-500">
                    Selected: {answers[qIdx].answer}
                  </span>
                )}
              </div>
            )}

            {getInstructions(q) && (
              <p className="text-sm italic text-gray-500 mt-1">
                {getInstructions(q)}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="w-full text-red-600 text-sm text-center mb-2 animate-pulse">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="w-full text-green-600 text-sm text-center mb-2 animate-pulse">
              {successMsg}
            </div>
          )}

          <div className="flex w-full justify-between gap-4 mt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0 || submitting}
              className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>

            {/* Show 'Next' until the final question */}
            {currentQuestionIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  !answers[currentQuestionIndex]?.answer ||
                  (Array.isArray(answers[currentQuestionIndex]?.answer) &&
                    answers[currentQuestionIndex]?.answer.length === 0) ||
                  submitting
                }
                className="px-6 py-2 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}

            {/* Show submit only on final question */}
            {currentQuestionIndex === questions.length - 1 && (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CareerAssessment;
