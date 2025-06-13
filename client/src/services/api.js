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
