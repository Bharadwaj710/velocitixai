import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import Assessments from "./pages/student/Assessments";
import Practice from "./pages/student/Practice";
import Jobs from "./pages/student/Jobs";
import StudentProfileSettings from "./pages/student/ProfileSettings";
import StudentDetails from "./pages/student/StudentDetails";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppContent = () => {
  const location = useLocation();

  // List of routes where Navbar should be hidden
  const hideNavbarRoutes = [
    "/admin-dashboard",
    "/hr",
    "/college-dashboard",
    "/student",
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

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

          {/* College routes */}
          <Route
            path="/college-dashboard/:slug"
            element={
              <ProtectedRoute requireCollege={true}>
                <CollegeDashboard />
              </ProtectedRoute>
            }
          />

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
                  <Route path="*" element={<StudentDashboard />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <AuthProvider>
          <AppContent />
          <Toaster position="top-right" />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
