import apiClient from "../api/apiClient";
import axios from "axios";

const BASE = process.env.REACT_APP_API_BASE_URL;
const BACKEND = process.env.REACT_APP_BACKEND_URL; // optional explicit backend host

// Helper: try multiple endpoint candidates (useful when backend prefix differs between deployments)
// This version will attempt absolute URLs against configured hosts (BASE and BACKEND)
// to avoid hitting the frontend static host when REACT_APP_API_BASE_URL was set incorrectly.
async function requestWithFallback(
  method,
  candidates,
  data = null,
  config = {}
) {
  let lastError = null;

  // Build absolute candidate URLs when possible to ensure we call the backend host
  const hosts = [];
  if (typeof BASE === "string" && BASE.trim())
    hosts.push(BASE.replace(/\/$/, ""));
  if (typeof BACKEND === "string" && BACKEND.trim() && BACKEND !== BASE)
    hosts.push(BACKEND.replace(/\/$/, ""));

  // If running in a browser, add only development-local derived hosts.
  // Avoid generating production-derived hosts which can cause SSL/REFUSED noise.
  try {
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.hostname
    ) {
      const hostname = window.location.hostname;
      // Only add localhost/127.0.0.1 derived hosts (http) to avoid HTTPS errors
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        const localDerived = [
          `http://localhost:8080`,
          `http://localhost:5000`,
          `http://127.0.0.1:8080`,
          `http://127.0.0.1:5000`,
        ];
        for (const h of localDerived) {
          const clean = h.replace(/\/$/, "");
          if (!hosts.includes(clean)) hosts.push(clean);
        }
      }
    }
  } catch (e) {
    /* ignore in non-browser environments */
  }

  // If no explicit hosts, fall back to relative calls via apiClient
  if (hosts.length === 0) {
    for (const path of candidates) {
      try {
        if (method === "get") return await apiClient.get(path, config);
        if (method === "post") return await apiClient.post(path, data, config);
        if (method === "put") return await apiClient.put(path, data, config);
        if (method === "delete") return await apiClient.delete(path, config);
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    throw lastError || new Error("All endpoint attempts failed");
  }

  // Try each host + candidate combination
  for (const host of hosts) {
    for (const path of candidates) {
      const url = path.startsWith("http")
        ? path
        : `${host}${path.startsWith("/") ? "" : "/"}${path}`;
      // Ensure Authorization header is present when calling absolute backend URLs
      const token = localStorage.getItem("token");
      const headers = { ...(config.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const localConfig = { ...config, headers };
      // If sending FormData, remove Content-Type to let browser/axios set boundary
      if (data instanceof FormData) {
        if (localConfig.headers) delete localConfig.headers["Content-Type"];
      }
      try {
        if (method === "get") return await axios.get(url, localConfig);
        if (method === "post") return await axios.post(url, data, localConfig);
        if (method === "put") return await axios.put(url, data, localConfig);
        if (method === "delete") return await axios.delete(url, localConfig);
      } catch (err) {
        lastError = err;
        // If response is HTML or a front-end 404 page, skip quickly to next host
        const respData = err?.response?.data;
        if (
          typeof respData === "string" &&
          /<!DOCTYPE html>|Cannot GET/i.test(respData)
        ) {
          // break inner loop to try next host
          break;
        }
        continue;
      }
    }
  }

  // As a last attempt, try relative calls via apiClient
  for (const path of candidates) {
    try {
      if (method === "get") return await apiClient.get(path, config);
      if (method === "post") return await apiClient.post(path, data, config);
      if (method === "put") return await apiClient.put(path, data, config);
      if (method === "delete") return await apiClient.delete(path, config);
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("All endpoint attempts failed");
}

// ==================== User Routes ====================

export const fetchUsers = () => apiClient.get(`/api/users`);
export const updateUser = (id, data) => apiClient.put(`/api/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/api/users/${id}`);

// ==================== Admin Dashboard Stats ====================
export const fetchOverviewStats = () => apiClient.get(`/api/stats/overview`);

// ==================== Admin - Users (Students, HRs, Colleges) ====================
export const fetchStudents = () => apiClient.get(`/admin/students`);
export const fetchHiredStudents = () => apiClient.get(`/admin/hired-students`);
export const fetchColleges = () => apiClient.get(`/admin/colleges`);
export const fetchHRs = () => apiClient.get(`/admin/hrs`);

// ==================== Admin Profile ====================
export const getProfile = () =>
  requestWithFallback("get", [
    "/admin/profile",
    "/api/admin/profile",
    "/api/profile",
    "/profile",
  ]);

export const updateProfile = (formData) =>
  requestWithFallback(
    "put",
    ["/admin/profile", "/api/admin/profile", "/api/profile", "/profile"],
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

export const deleteProfile = () =>
  requestWithFallback("delete", [
    "/admin/profile",
    "/api/admin/profile",
    "/api/profile",
    "/profile",
  ]);

// ==================== Notifications ====================
export const fetchRecentNotifications = () =>
  apiClient.get(`/admin/notifications/recent`);

export const fetchAllNotifications = () =>
  apiClient.get(`/admin/notifications/all`);

export const markNotificationAsRead = (id) =>
  apiClient.put(`/admin/notifications/${id}/read`);

export const clearAllNotifications = () =>
  apiClient.delete(`/admin/notifications/clear`);

// ==================== Courses ====================
export const fetchCourses = () => apiClient.get(`/api/courses`);
export const createCourse = (courseData) =>
  apiClient.post(`/api/courses`, courseData);
export const updateCourse = (id, data) =>
  apiClient.put(`/api/courses/${id}`, data);
export const deleteCourse = (id) => apiClient.delete(`/api/courses/${id}`);
