import { useEffect, useState } from "react";
import { fetchAllNotifications } from "../../services/api";
import axios from "axios";
import toast from "react-hot-toast";
import {
  X,
  UserPlus,
  BookOpen,
  Bell,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const RecentActivityPage = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await fetchAllNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
      toast.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?"))
      return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/admin/notifications/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Notifications cleared");

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("navigateToOverview"));
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/${id}`);
      toast.success("Notification removed");
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (message) => {
    if (message.toLowerCase().includes("student") && message.includes("hired"))
      return <CheckCircle className="text-green-600 w-5 h-5" />;
    if (message.toLowerCase().includes("course"))
      return <BookOpen className="text-yellow-600 w-5 h-5" />;
    if (message.toLowerCase().includes("student"))
      return <UserPlus className="text-indigo-600 w-5 h-5" />;
    return <Bell className="text-gray-400 w-5 h-5" />;
  };

  const highlightMessage = (msg) => {
    if (msg.toLowerCase().includes("course")) {
      return (
        <>
          <span className="block font-medium text-yellow-700">{msg}</span>
          <span className="block text-sm text-orange-500 mt-1">
            ⚠️ Please generate transcript & quizzes for this course.
          </span>
        </>
      );
    }
    return <span>{msg}</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No notifications available.
          </div>
        ) : (
          notifications.map((note) => (
            <div
              key={note._id}
              className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition duration-200 flex items-start gap-3"
            >
              <div className="mt-1">{getNotificationIcon(note.message)}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-800">
                  {highlightMessage(note.message)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDeleteNotification(note._id)}
                className="text-gray-400 hover:text-red-500 transition ml-2"
                title="Remove"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityPage;
