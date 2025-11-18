import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
baseURL: `${process.env.REACT_APP_API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to add authorization header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for consistent error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);

export const handleSuccess = (msg) => {
    toast.success(msg, { position: "top-right" });
};

export const handleError = (msg) => {
    toast.error(msg, { position: "top-right" });
};

export default api;
