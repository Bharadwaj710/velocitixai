import { useEffect, useState } from 'react';
import { fetchAllNotifications } from '../../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const RecentActivityPage = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    const res = await fetchAllNotifications();
    setNotifications(res.data);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

 const clearAll = async () => {
  if (!window.confirm("Are you sure you want to clear all notifications?")) return;
  try {
    await axios.delete("http://localhost:8080/admin/notifications/clear", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    });

    toast.success("Notifications cleared");

    setTimeout(() => {
      // Navigate to overview tab in dashboard
      window.dispatchEvent(new CustomEvent("navigateToOverview"));

      // 🔄 Fully reload the page to remove all cached notifications from state
      window.location.reload();
    }, 1000);
  } catch (err) {
    toast.error("Failed to clear notifications");
  }
};

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">All Notifications</h2>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-600 hover:underline">
            Clear All
          </button>
        )}
      </div>
      <div className="space-y-4">
        {notifications.map(note => (
          <div key={note._id} className="border p-3 rounded shadow hover:bg-gray-50">
            <p className="text-sm">{note.message}</p>
            <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityPage;
