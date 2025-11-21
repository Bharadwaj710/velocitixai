import React, { useEffect, useState } from "react";
import axios from "axios"; // kept for external scoring service
import apiClient from "../../api/apiClient";
import { Lock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuizSection = ({
  lessonId,
  courseId,
  userId,
  onComplete,
  disabled,
  onClose,
  showHeader = true,
  goToNextLesson,
  goToCurrentLesson,
}) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canClose, setCanClose] = useState(false);
  const [initialAttemptLoaded, setInitialAttemptLoaded] = useState(false);

  const navigate = useNavigate();

  // 🔹 Load quiz + check if already attempted
  useEffect(() => {
    if (!lessonId || !courseId || !userId) return;

    const loadQuizAndProgress = async () => {
      setLoading(true);
      try {
        const [quizRes, progressRes] = await Promise.all([
          apiClient.get(`/api/quiz/${lessonId}`),
          apiClient.get(`/api/progress/${userId}/${courseId}`),
        ]);

        const quizData = quizRes.data;
        setQuiz(quizData);
        setAnswers(Array.isArray(quizData.questions) ? quizData.questions.map(() => ({ answer: "" })) : []);
        setTimeLeft(Array.isArray(quizData.questions) ? quizData.questions.length * 60 : 0);

        const existingAttempt = (Array.isArray(progressRes.data.quizResults) ? progressRes.data.quizResults : []).find(
          (q) => q.lessonId === lessonId || q.lessonId?._id === lessonId
        );

        if (existingAttempt) {
          const feedback = quizData.questions.map((q, idx) => {
            const correct = q.answer?.trim().toLowerCase();
            const userAnswer = existingAttempt.answers?.[idx]
              ?.trim()
              .toLowerCase();
            return userAnswer === correct ? "Correct" : "Wrong";
          });

          setResult({
            totalScore: existingAttempt.score,
            passed: existingAttempt.passed,
            answers: existingAttempt.answers,
            feedback: existingAttempt.feedback || [],
          });

          setCanClose(true);
        }

        setInitialAttemptLoaded(true);
      } catch (err) {
        console.error("❌ Error loading quiz or progress:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuizAndProgress();
  }, [lessonId, courseId, userId]);

  // 🔹 Timer logic
  useEffect(() => {
    if (result || submitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result, submitting]);

  const q = quiz?.questions?.[currentIdx];

  const handleChange = (val) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIdx ? { answer: val } : a))
    );
  };

  const handlePrev = () => setCurrentIdx((i) => Math.max(i - 1, 0));
  const handleNext = () =>
    setCurrentIdx((i) => Math.min(i + 1, quiz.questions.length - 1));

  const allAnswered = answers.every((a) => a.answer.trim() !== "");

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        studentAnswers: answers.map((a) => a.answer),
        originalQuestions: quiz.questions,
        studentId: userId,
        lessonId,
      };

      const { data: scoreData } = await axios.post(
        "http://localhost:5001/score-quiz",
        payload
      );

      // Ensure result.answers and feedback are set immediately for UI
      setResult({
        ...scoreData,
        answers: answers.map((a) => a.answer),
        feedback: scoreData.feedback,
        // fallback for correctAnswer if not present
        questions: quiz.questions,
      });

      await apiClient.post("/api/progress/submit-quiz", {
        studentId: userId,
        courseId,
        lessonId,
        score: scoreData.totalScore,
        passed: scoreData.totalScore >= 60,
        answers: answers.map((a) => a.answer),
        feedback: scoreData.feedback,
      });

      setCanClose(true);
      onComplete?.({
        score: scoreData.totalScore,
        passed: scoreData.totalScore >= 60,
        answers,
      });
    } catch (err) {
      console.error("❌ Quiz submission failed:", err.message);
      setResult({ error: "Quiz submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers(quiz.questions.map(() => ({ answer: "" })));
    setCurrentIdx(0);
    setResult(null);
    setTimeLeft(quiz.questions.length * 60);
    setCanClose(false);
  };

  const handleNextLesson = () => {
    if (typeof goToNextLesson === "function") {
      goToNextLesson();
    }
    if (typeof onClose === "function") onClose();
  };
  const handleRewatchLesson = () => {
    if (typeof goToCurrentLesson === "function") {
      goToCurrentLesson();
    }
    if (typeof onClose === "function") onClose();
  };

  const progressPercent = quiz?.questions?.length
    ? Math.round(((currentIdx + 1) / quiz.questions.length) * 100)
    : 0;

  if (loading || !initialAttemptLoaded) {
    return <div className="p-4 text-center text-gray-500">Loading quiz...</div>;
  }

  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No quiz for this lesson.
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="p-6 bg-white shadow rounded-xl text-gray-400 flex items-center justify-center min-h-[70vh]">
        <Lock className="w-6 h-6 mr-2" />
        <span>Quiz is locked. Complete the lesson first.</span>
      </div>
    );
  }

  // 🔹 Show results if quiz already attempted

  if (result) {
    const lessonIdStr = typeof lessonId === "string" ? lessonId : lessonId?._id;

    return (
      <div className="p-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button at top right */}
        <button
          className="absolute top-4 right-6 text-xs text-gray-400 hover:text-blue-600 z-10"
          onClick={onClose}
        >
          Close
        </button>
        <div className="text-2xl font-bold text-blue-700 mb-4">Quiz Result</div>

        {result.error ? (
          <div className="text-red-600 text-lg">{result.error}</div>
        ) : (
          <>
            <div className="text-xl mb-4">
              Score:{" "}
              <span
                className={
                  result.totalScore >= 60
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {result.totalScore}%
              </span>
            </div>

            <ul className="mb-6">
              {quiz.questions.map((q, idx) => (
                <li
                  key={idx}
                  className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="font-semibold mb-1">
                    {idx + 1}. {q.question}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {result.feedback?.[idx] === "Correct" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-red-500 font-bold text-lg">✗</span>
                    )}
                    <span
                      className={
                        result.feedback?.[idx] === "Correct"
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {result.feedback?.[idx]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Your answer:{" "}
                    <span className="font-mono">
                      {result.answers?.[idx] || <i>Blank</i>}
                    </span>
                  </div>
                  {/* Show correct answer from q.answer or q.correctAnswer for compatibility */}
                  {(q.answer || q.correctAnswer) && (
                    <div className="text-xs text-green-700 mt-1">
                      Correct answer:{" "}
                      <span className="font-mono">
                        {q.answer || q.correctAnswer}
                      </span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-xs text-blue-700 mt-1">
                      Explanation: {q.explanation}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* 🔹 Guidance line */}
            <div
              className={`text-base font-semibold px-4 py-3 rounded-lg mb-6 ${
                result.totalScore >= 60
                  ? "bg-green-100 text-green-800"
                  : result.totalScore < 30
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {result.totalScore >= 60
                ? "Great job! You’ve passed the quiz. Proceed to the next lesson."
                : result.totalScore < 30
                ? "We strongly recommend watching the lesson again to improve understanding before retaking the quiz."
                : "You’re close! Consider revisiting the lesson and try the quiz again."}
            </div>

            {/* 🔹 Buttons section */}
            <div className="flex justify-between items-center">
              {/* Bottom-left logic */}
              {result.totalScore >= 60 ? (
                <button
                  onClick={handleNextLesson}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Go to Next Lesson
                </button>
              ) : (
                <button
                  onClick={handleRewatchLesson}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700"
                >
                  Watch Lesson Again
                </button>
              )}

              {/* Always show Retake Quiz */}
              <button
                onClick={handleRetake}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700"
              >
                Retake Quiz
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // 🔹 Quiz questions view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="p-10 bg-white rounded-2xl shadow-2xl w-full max-w-5xl min-h-[80vh] flex flex-col justify-between relative">
        {showHeader && (
          <div className="text-2xl font-bold mb-6 text-blue-700 flex justify-between items-center">
            <span>Quiz</span>
            <span className="text-sm font-mono text-red-500">
              Time left: {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm text-gray-500 font-mono">
            <span>
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded bg-gray-200 mb-4 overflow-hidden">
            <div
              className="h-2 bg-blue-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mb-3 text-lg font-semibold">{q.question}</div>
          {q.type === "mcq" ? (
            <div className="flex flex-col gap-3 mb-6">
              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                    answers[currentIdx]?.answer === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${currentIdx}`}
                    value={opt}
                    checked={answers[currentIdx]?.answer === opt}
                    onChange={() => handleChange(opt)}
                    className="accent-blue-600"
                    disabled={submitting}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : q.type === "fill" ? (
            <input
              className="w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={answers[currentIdx]?.answer || ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <textarea
              rows={4}
              className="w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={answers[currentIdx]?.answer || ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
              onPaste={(e) => e.preventDefault()}
            />
          )}
        </div>
        <div className="flex justify-between mt-2">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          {currentIdx < quiz.questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
        {canClose ? (
          <button
            className="absolute top-4 right-6 text-xs text-gray-400 hover:text-blue-600"
            onClick={onClose}
          >
            Cancel
          </button>
        ) : (
          <span className="absolute top-4 right-6 text-xs text-gray-300 cursor-not-allowed">
            ⏳ Locked
          </span>
        )}
      </div>
    </div>
  );
};

export default QuizSection;
