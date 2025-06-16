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
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.role === "admin" || userData.isAdmin === true) {
      navigate("/admin-dashboard");
    } else {
      switch (userData.role) {
        case "hr":
          navigate("/hr-dashboard");
          break;
        case "college":
          navigate(`/college-dashboard/${userData.collegeSlug}`);
          break;
        case "student":
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
          navigate("/");
      }
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
