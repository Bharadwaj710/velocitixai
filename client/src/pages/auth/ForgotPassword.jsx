import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/api";
import apiClient from "../../api/apiClient";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds

  const navigate = useNavigate();

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startCountdown = () => {
    setCanResend(false);
    let timeLeft = 120;

    const timer = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);

      if (timeLeft === 0) {
        clearInterval(timer);
        setCanResend(true);
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      handleError("Email is required");
      return;
    }

    if (isLoading || !canResend) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/auth/forgot-password`, formData);
      const data = response.data;

      if (!response.ok) {
        handleError(data.message || "Failed to process request");
        return;
      }

      if (data.success) {
        handleSuccess("Reset password link has been sent to your email");
        startCountdown();
      } else {
        handleError(data.message || "Failed to send reset link");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      handleError("Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup any existing timer when component unmounts
      clearInterval();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div>
          <h4 className="text-center text-3xl font-bold text-gray-900">
            Forgot Password
          </h4>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            {" "}
            <button
              type="submit"
              disabled={isLoading || !canResend}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${
                canResend
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  : "bg-gray-400 cursor-not-allowed"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition`}
            >
              {isLoading ? (
                <span>Sending...</span>
              ) : !canResend ? (
                `Resend in ${formatTime(countdown)}`
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
          {!canResend && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Please check your email for the reset link. If you don't see it,
              check your spam folder.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
