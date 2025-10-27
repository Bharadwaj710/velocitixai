// All your imports (no changes needed here)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import HRDashboard from "./pages/hr/Dashboard";
import CollegeDashboard from "./pages/college/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentNavbar from "./components/StudentNavbar";
import Assessments from "./pages/student/CareerAssessment";
import Practice from "./pages/student/Practice";
import Jobs from "./pages/student/Jobs";
import StudentProfileSettings from "./pages/student/ProfileSettings";
import StudentDetails from "./pages/student/StudentDetails";
import StudentCourses from "./pages/student/StudentCourses";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HRProfile from "./pages/hr/Profile";
import CollegeOnboarding from "./pages/college/CollegeOnboarding";
import ChatAssistant from "./components/ChatAssistant/ChatAssistant";
import CoursePlayer from "./pages/student/CoursePlayer";
import MyLearning from "./pages/student/MyLearning";
import LearningPath from "./pages/student/LearningPath";
import AIInterview from "./pages/ai-interview/AIInterview";
import AIInterviewInstructions from "./pages/ai-interview/AIInterviewInstructions";
import InterviewAnalysis from "./pages/ai-interview/InterviewAnalysis";

const AppContent = () => {
  const location = useLocation();

  const hideNavbarRoutes = [
    "/admin-dashboard",
    "/hr",
    "/college-dashboard",
    "/student",
    "/course-player",
    "/ai-interview",
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const showChatbot =
    ["/student/CoursePlayer"].includes(location.pathname) &&
    location.pathname !== "/ai-interview";

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main className={shouldHideNavbar ? "w-full" : "pt-16 w-full"}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/ai-interview"
            element={
              <>
                <AIInterview />
              </>
            }
          />
          <Route
            path="/ai-interview-instructions"
            element={<AIInterviewInstructions />}
          />
          <Route path="/ai-interview-analysis/:courseId" element={<InterviewAnalysis />} />

          {/* Admin routes */}
          <Route
            path="/admin-dashboard/*"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* HR routes */}
          <Route
            path="/hr-dashboard"
            element={
              <ProtectedRoute requireHR={true}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/profile"
            element={
              <ProtectedRoute requireHR={true}>
                <HRProfile />
              </ProtectedRoute>
            }
          />

          {/* College routes */}
          <Route
            path="/college-dashboard/:slug"
            element={
              <ProtectedRoute requireCollege={true}>
                <CollegeDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/college/onboarding" element={<CollegeOnboarding />} />

          {/* Course Player */}
          <Route path="/course-player/:id" element={<CoursePlayer />} />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute>
                <StudentNavbar />
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="assessments" element={<Assessments />} />
                  <Route path="practice" element={<Practice />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route
                    path="profilesettings"
                    element={<StudentProfileSettings />}
                  />
                  <Route path="details" element={<StudentDetails />} />
                  <Route path="courses" element={<StudentCourses />} />
                  <Route path="student/courses" element={<StudentCourses />} />
                  <Route path="CoursePlayer" element={<CoursePlayer />} />
                  <Route path="my-learning" element={<MyLearning />} />
                  <Route path="learning-path" element={<LearningPath />} />
                  <Route path="*" element={<StudentDashboard />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
        {showChatbot && <ChatAssistant />}
      </main>
    </>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
            <Toaster position="top-right" />
            <ToastContainer position="top-right" autoClose={3000} />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
