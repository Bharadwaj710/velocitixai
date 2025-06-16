import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import HRDashboard from './pages/hr/Dashboard';
import CollegeDashboard from './pages/college/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';


const AppContent = () => {
  const location = useLocation();

  // List of routes where Navbar should be hidden
  const hideNavbarRoutes = [
    '/admin-dashboard',
    '/hr',
    '/college-dashboard',
    '/student',
  ];

  const shouldHideNavbar = hideNavbarRoutes.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main className={shouldHideNavbar ? 'w-full' : 'pt-16 w-full'}>
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
                <StudentDashboard />
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
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
