import axios from "axios";
axios.defaults.withCredentials = true;


const BASE = process.env.REACT_APP_API_BASE_URL;



// ==================== User Routes ====================

export const fetchUsers = () => axios.get(`${BASE}/api/users`);
export const updateUser = (id, data) => axios.put(`${BASE}/api/users/${id}`, data);
export const deleteUser = (id) => axios.delete(`${BASE}/api/users/${id}`);

// ==================== Admin Dashboard Stats ====================
export const fetchOverviewStats = () => axios.get(`${BASE}/api/stats/overview`);

// ==================== Admin - Users (Students, HRs, Colleges) ====================
export const fetchStudents = () => axios.get(`${BASE}/admin/students`);
export const fetchHiredStudents = () => axios.get(`${BASE}/admin/hired-students`);
export const fetchColleges = () => axios.get(`${BASE}/admin/colleges`);
export const fetchHRs = () => axios.get(`${BASE}/admin/hrs`);

// ==================== Admin Profile ====================
export const getProfile = () =>
  axios.get(`${BASE}/admin/profile`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const updateProfile = (formData) =>
  axios.put(`${BASE}/admin/profile`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteProfile = () =>
  axios.delete(`${BASE}/admin/profile`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// ==================== Notifications ====================
export const fetchRecentNotifications = () =>
  axios.get(`${BASE}/admin/notifications/recent`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const fetchAllNotifications = () =>
  axios.get(`${BASE}/admin/notifications/all`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const markNotificationAsRead = (id) =>
  axios.put(`${BASE}/admin/notifications/${id}/read`, null, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const clearAllNotifications = () =>
  axios.delete(`${BASE}/admin/notifications/clear`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// ==================== Courses ====================
export const fetchCourses = () => axios.get(`${BASE}/api/courses`);
export const createCourse = (courseData) => axios.post(`${BASE}/api/courses`, courseData);
export const updateCourse = (id, data) => axios.put(`${BASE}/api/courses/${id}`, data);
export const deleteCourse = (id) => axios.delete(`${BASE}/api/courses/${id}`);
