import axios from "axios";

const BASE = "http://localhost:8080";

export const fetchUsers = () => axios.get(`${BASE}/api/users`);
export const updateUser = (id, data) =>
  axios.put(`${BASE}/api/users/${id}`, data);
export const deleteUser = (id) => axios.delete(`${BASE}/api/users/${id}`);
export const fetchOverviewStats = () => axios.get(`${BASE}/api/stats/overview`);
export const fetchStudents = () => axios.get(`${BASE}/admin/students`);
export const fetchColleges = () => axios.get(`${BASE}/admin/colleges`);
export const fetchHRs = () => axios.get(`${BASE}/admin/hrs`);
export const getProfile = () => axios.get(`${BASE}/admin/profile`);
export const updateProfile = (data) => axios.put(`${BASE}/admin/profile`, data);
export const deleteProfile = () => axios.delete(`${BASE}/admin/profile`);
export const fetchRecentNotifications = () => axios.get(`${BASE}/admin/notifications/recent`);
export const fetchAllNotifications = () => axios.get(`${BASE}/admin/notifications/all`);
export const markNotificationAsRead = (id) => axios.put(`${BASE}/admin/notifications/${id}/read`);
