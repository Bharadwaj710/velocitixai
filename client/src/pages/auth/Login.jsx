import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { handleError, handleSuccess } from '../../utils/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.email.trim() || !formData.password.trim()) {
      handleError('All fields are required');
      return;
    }

    try {
      const url = 'http://localhost:8080/auth/login';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      const { message, success, user, token } = result;

      if (!response.ok) throw new Error(message || 'Login failed');

      if (success) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        handleSuccess(message || 'Login successful!');

        setTimeout(() => {
          if (user.isAdmin === true) {
            navigate('/admin-dashboard');
          } else {
            navigate('/student-dashboard');
          }
        }, 1500);
      } else {
        handleError(message || 'Login failed');
      }
    } catch (error) {
      handleError(error.message || 'Login failed');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const token = credentialResponse.credential;
    console.log("Google Token:", token);

    try {
      const res = await fetch("http://localhost:8080/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      const { success, message, jwtToken, user } = data;

      if (success) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(user));
        handleSuccess("Google login successful!");

        setTimeout(() => {
          if (user.isAdmin === true) {
            navigate("/admin-dashboard");
          } else {
            navigate("/student-dashboard");
          }
        }, 1500);
      } else {
        handleError(message || "Google login failed");
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      handleError("Something went wrong with Google login.");
    }
  };

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
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account to continue</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Forgot & Register */}
        <div className="flex flex-col space-y-4 text-sm text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-gray-500">Trouble signing in?</span>
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              Forgot Password
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
              Sign up
            </Link>
          </div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center mt-4">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => handleError("Google login failed")}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
