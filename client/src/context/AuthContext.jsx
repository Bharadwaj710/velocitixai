import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Check localStorage for user data on initial load
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === "object") {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("user"); // Remove invalid data
        }
      }
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      localStorage.removeItem("user"); // Remove invalid data
    } finally {
      setLoading(false);
    }
  }, []);
 const login = (userData) => {
  // Basic validation
  if (!userData || !userData.role || !userData._id) {
    console.error("Invalid user data received:", userData);
    alert("Login failed. Please try again.");
    return;
  }

  // Save user globally and locally
  setUser(userData);
  localStorage.setItem("user", JSON.stringify(userData));

  // Admins (either role or isAdmin)
  if (userData.role === "admin" || userData.isAdmin === true) {
    navigate("/admin-dashboard");
    return;
  }

  // Handle different roles
  switch (userData.role) {
    case "hr":
      navigate("/hr-dashboard");
      break;

    case "college":
      // If no slug → onboarding, else → redirect to their dashboard
      if (!userData.collegeSlug) {
        navigate("/college/onboarding");
      } else {
        navigate(`/college-dashboard/${userData.collegeSlug}`);
      }
      break;

    case "student":
      // Store extra student info
      localStorage.setItem(
        "student",
        JSON.stringify({
          name: userData.name,
          email: userData.email,
          id: userData._id,
          imageUrl: userData.imageUrl || "",
        })
      );
      navigate("/student/dashboard");
      break;

    default:
      // Unknown role → fallback
      console.warn("Unrecognized user role:", userData.role);
      navigate("/");
      break;
  }
};


  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("student");
    localStorage.removeItem("token");
    navigate("/login");
  };
  const value = {
    user,
    setUser,
    login,
    logout,
    isAdmin: user?.role === "admin" || user?.isAdmin === true,
    isAuthenticated: !!user,
    userRole: user?.role || null,
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
