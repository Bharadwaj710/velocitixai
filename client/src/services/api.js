import axios from 'axios';

const BASE = 'http://localhost:8080';

export const fetchUsers = () => axios.get(`${BASE}/admin/users`);
export const fetchStudents = () => axios.get(`${BASE}/admin/students`);
export const fetchColleges = () => axios.get(`${BASE}/admin/colleges`);
export const fetchHRs = () => axios.get(`${BASE}/admin/hrs`);
