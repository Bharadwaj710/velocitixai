import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireHR = false,
  requireCollege = false,
  requireStudent = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based route protection
  if (requireAdmin && !user.isAdmin) {
    console.log("Access denied: Admin route");
    return <Navigate to="/" replace />;
  }

  if (requireHR && user.role !== "hr") {
    console.log("Access denied: HR route");
    return <Navigate to="/" replace />;
  }

  if (requireCollege && user.role !== "college") {
    console.log("Access denied: College route");
    return <Navigate to="/" replace />;
  }

  if (requireStudent && user.role !== "student") {
    console.log("Access denied: Student route");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
