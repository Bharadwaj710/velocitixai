import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const [progressLevel, setProgressLevel] = useState("Beginner");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`/api/recommendations/${user.id || user._id}`);
        if (res.data.profile_analysis) {
          setProfile(res.data.profile_analysis);
          setRecommendedCourses(res.data.recommended_courses || []);
          setProgressLevel(res.data.profile_analysis.level || "Beginner");
          setShowAssessmentBtn(false);
        } else {
          setShowAssessmentBtn(true);
        }
      } catch (err) {
        setShowAssessmentBtn(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
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
                <p className="text-lg font-semibold text-gray-700 mb-2">{progressLevel}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500`} 
                    style={{ width: progressLevel === "Beginner" ? "30%" : progressLevel === "Intermediate" ? "60%" : "90%" }}
                  ></div>
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
              <p className="text-gray-600 mb-4">Explore personalized modules based on your level.</p>
              {/* You can replace below with a preview of enrolled modules */}
              <div className="bg-white rounded-xl p-4 shadow-sm">Modules preview will appear here.</div>
            </section>

            <section className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">Recommended Courses</h2>
                <button
                  onClick={() => navigate("/student/courses")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All Courses
                </button>
              </div>
              {recommendedCourses.length === 0 ? (
                <p className="text-gray-500 italic">No recommendations found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCourses.slice(0, 3).map((course, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-md">
                      <h3 className="text-lg font-bold text-blue-700 mb-1">{course.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Resume Your Course</h2>
              <button
                onClick={() => navigate("/student/course/player")}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow hover:scale-105 transition"
              >
                Go to Learning</button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
