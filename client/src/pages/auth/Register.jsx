import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const navigate = useNavigate();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?#&^_-])[A-Za-z\d@$!%?#&^_-]{4,}$/;


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate password
    if (name === "password") {
      if (!passwordRegex.test(value)) {
        setPasswordError(
          "Password must be at least 4 characters and include uppercase, lowercase, number, and special character."
        );
      } else {
        setPasswordError("");
      }
    }

    // Validate confirm password
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setConfirmError("Passwords do not match");
      } else {
        setConfirmError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      handleError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    if (passwordError) {
      handleError("Fix the password error");
      return;
    }

    try {

      const { name, email, password } = formData;
      const res = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "student" }),
      });


      const result = await res.json();
      if (!res.ok) {
        handleError(result.message || "Registration failed");
        return;
      }

      if (result.success) {
        // Save imageUrl if present
        if (result.user && result.user.imageUrl) {
          localStorage.setItem("user", JSON.stringify({ ...result.user, imageUrl: result.user.imageUrl }));
        } else {
          localStorage.setItem("user", JSON.stringify(result.user));
        }
        handleSuccess(result.message || "Registration successful!");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        handleError(result.message || "Registration failed");
      }
    } catch (err) {
      handleError(err.message || "Registration failed");
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    const token = credentialResponse.credential;

    try {
      const res = await fetch("http://localhost:8080/auth/google-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.jwtToken);
        handleSuccess(data.message || "Signup successful!");
        setTimeout(() => navigate("/student-dashboard"), 1500);
      } else {
        handleError(data.message || "Signup failed");
      }
    } catch (err) {
      handleError("Something went wrong during Google signup");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join us today and get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

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
                className="mt-1 block w-full px-3 py-2 border rounded-md"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {confirmError && (
                <p className="text-xs text-red-500 mt-1">{confirmError}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-purple-700"
          >
            Create Account
          </button>
        </form>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="mx-2 text-sm text-gray-500">OR</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSignup}
            onError={() => console.log("Google Signup Failed")}
          />
        </div>

        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
