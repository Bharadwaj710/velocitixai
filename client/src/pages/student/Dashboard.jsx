import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [learningProgress, setLearningProgress] = useState({
    courseTitle: "",
    progressPercent: 0,
    completedModules: 0,
    totalModules: 0,
    readinessPercent: null,
    readinessDetails: null,
  });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get(`/api/students/progress/${user.id || user._id}`);

        if (res.data.readinessPercent !== null && res.data.readinessPercent !== undefined) {
          setShowAssessmentBtn(false);
        } else {
          setShowAssessmentBtn(true);
        }

        setLearningProgress(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10 px-4 sm:px-8 max-w-6xl mx-auto">
        {showAssessmentBtn ? (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-6">Welcome, {user.name?.split(" ")[0]}</h1>
            <p className="mb-6 text-gray-600">To get started, please take your Career Assessment.</p>
            <button
              onClick={() => navigate("/student/assessments")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
            >
              Take Career Assessment <ArrowRight className="inline ml-1" />
            </button>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Career Readiness Score</h2>
              <div className="bg-white rounded-xl p-4 shadow-md text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-700 mb-1">
                    {learningProgress.readinessPercent !== null
                      ? `${learningProgress.readinessPercent}%`
                      : "Beginner"}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{
                        width:
                          learningProgress.readinessPercent !== null
                            ? `${learningProgress.readinessPercent}%`
                            : "30%",
                      }}
                    ></div>
                  </div>
                  {learningProgress.readinessDetails && (
                    <div className="text-xs text-gray-500 mt-1 flex flex-col items-center">
                      {learningProgress.readinessDetails.confidenceScore !== undefined && (
                        <span>Confidence: {learningProgress.readinessDetails.confidenceScore} / 10</span>
                      )}
                      {learningProgress.readinessDetails.communicationClarity !== undefined && (
                        <span>Communication: {learningProgress.readinessDetails.communicationClarity} / 10</span>
                      )}
                      {learningProgress.readinessDetails.tone && (
                        <span>Tone: {learningProgress.readinessDetails.tone}</span>
                      )}
                    </div>
                  )}
                  {learningProgress.readinessPercent !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      Based on your confidence, tone, and communication analysis
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">Your Learning Path</h2>
                <button
                  onClick={() => navigate("/student/learning-path")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Show Full Learning Path
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {learningProgress.courseTitle
                  ? `Course: ${learningProgress.courseTitle}`
                  : "Explore personalized modules based on your level."}
              </p>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-gray-700">Progress: {learningProgress.progressPercent || 0}%</span>
                  <span className="text-xs text-gray-500">
                    {learningProgress.completedModules || 0} of {learningProgress.totalModules || 0} modules completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ width: `${learningProgress.progressPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Resume Your Course</h2>
              <button
                onClick={() => navigate("/student/course/player")}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow hover:scale-105 transition"
              >
                Go to Learning
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
