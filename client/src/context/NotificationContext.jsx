import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const student = JSON.parse(localStorage.getItem("student"));
  const studentId = student?._id;

  // Fetch notifications from server
  useEffect(() => {
    if (studentId) {
      fetchNotifications();
    }
  }, [studentId]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/api/notifications/${studentId}`);
      const formatted = res.data.map((n) => ({
        ...n,
        link: n.meta?.link || "/student/courses",
        courseId: n.meta?.courseId || null,
      }));
      setNotifications(formatted);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const addNotification = async (notification) => {
    try {
      await axios.post("/api/notifications", notification);
      fetchNotifications();
    } catch (error) {
      console.error("Error adding notification", error);
    }
  };

  const removeNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error removing notification", error);
    }
  };

  const clearNotifications = async () => {
    try {
      await axios.delete(`/api/notifications/clear/${studentId}`);
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
