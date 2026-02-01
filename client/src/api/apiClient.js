/**
 * Centralized Axios Client for VeloAI
 *
 * Features:
 * - Automatic JWT bearer token injection via request interceptor
 * - Request/response error handling via interceptors
 * - Support for multipart/form-data and application/json
 * - Consistent error responses across app
 * - Base URL configuration from environment variables
 *
 * Usage:
 *   import apiClient from '@/api/apiClient';
 *
 *   // Simple GET
 *   apiClient.get('/api/courses')
 *
 *   // With headers for multipart
 *   apiClient.post('/api/upload', formData, {
 *     headers: { 'Content-Type': 'multipart/form-data' }
 *   })
 *
 *   // With custom config
 *   apiClient.get('/api/students', {
 *     params: { filter: 'active' }
 *   })
 */

import axios from "axios";

// Get base URL from environment or fallback to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Automatically attaches JWT token from localStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve token from localStorage
    const token = localStorage.getItem("token");

    // Attach bearer token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle multipart/form-data (don't set Content-Type header)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    // Handle request setup errors
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors consistently across the app
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorObj = {
      message: "An error occurred",
      status: null,
      data: null,
    };

    if (error.response) {
      // Server responded with error status
      errorObj.status = error.response.status;
      errorObj.message =
        error.response.data?.message || error.response.statusText;
      errorObj.data = error.response.data;

      // Handle 401 Unauthorized (token expired/invalid)
      if (error.response.status === 401) {
        console.warn("Unauthorized: Token may be expired");
        // Clear token and optionally redirect to login
        localStorage.removeItem("token");
        // Note: Redirect to login should be handled by individual components/pages
        // to allow for graceful degradation
      }

      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.warn("Forbidden: Insufficient permissions");
      }

      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.warn("Not found:", error.response.config?.url);
      }

      // Handle 500 Server Error
      if (error.response.status >= 500) {
        console.error("Server error:", error.response.statusText);
      }
    } else if (error.request) {
      // Request made but no response received
      errorObj.message =
        "No response from server. Please check your connection.";
      console.error("No response received:", error.request);
    } else {
      // Error in request setup
      errorObj.message = error.message || "Request failed";
      console.error("Error:", error.message);
    }

    return Promise.reject(errorObj);
  }
);

export default apiClient;
