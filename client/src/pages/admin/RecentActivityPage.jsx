import { useEffect, useState } from 'react';
import { fetchAllNotifications } from '../../services/api';

const RecentActivityPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetchAllNotifications();
      setNotifications(res.data);
    };
    load();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Notifications</h2>
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
