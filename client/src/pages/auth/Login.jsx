// ✅ Updated Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';

import { handleError, handleSuccess } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      handleError('All fields are required');
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Login failed');

      const { user, token } = result;

      // ✅ Save user data properly
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify({
        name: user.name,
        email: user.email,
        id: user._id,
        imageUrl: user.imageUrl || ''
      }));

      login(user);
      handleSuccess('Login successful!');
    } catch (err) {
      handleError(err.message || 'Login failed');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const token = credentialResponse.credential;
    try {
      const res = await fetch('http://localhost:8080/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await res.json();
      const { success, jwtToken, user } = result;

      if (success) {
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('admin', JSON.stringify({
          name: user.name,
          email: user.email,
          id: user._id,
          imageUrl: user.imageUrl || ''
        }));
        login(user);
        handleSuccess('Google login successful!');
      } else {
        handleError(result.message || 'Google login failed');
      }
    } catch (err) {
      handleError('Something went wrong with Google login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-3 py-2 border rounded-md"
            />
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>

        <div className="flex flex-col space-y-4 text-sm text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
            Forgot Password?
          </Link>
          <div className="border-t pt-4">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-blue-600 font-medium">Sign up</Link>
          </div>
        </div>

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