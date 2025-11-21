import apiClient from "../api/apiClient";

const BASE = process.env.REACT_APP_API_BASE_URL;

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
export const getProfile = () => apiClient.get(`/admin/profile`);

export const updateProfile = (formData) =>
  apiClient.put(`/admin/profile`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteProfile = () => apiClient.delete(`/admin/profile`);

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
