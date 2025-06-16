import React from "react";
import {
  ArrowRight,
  ClipboardList,
  Briefcase,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("student")) || {};
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-24 pb-12 px-4 sm:px-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome, {user.name ? user.name.split(" ")[0] : "Student"}!
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Velocitix AI is here to support your career readiness journey.
            Explore personalized assessments, practice modules, and job
            opportunities tailored just for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/student/assessments")}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>Take Career Assessment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <ClipboardList className="w-10 h-10 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Assessment Progress</h3>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Practice Modules</h3>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <Briefcase className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Jobs Applied</h3>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition">
            <FileText className="w-10 h-10 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Resume Tips</h3>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
