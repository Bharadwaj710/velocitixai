import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import EditUser from "./EditUser";
import { fetchUsers, updateUser, deleteUser } from "../../services/api";

const UserList = ({
  setShowUserModal,
  setSelectedUser,
  showUserModal,
  selectedUser,
  selectedRole = "all",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentRole, setCurrentRole] = useState(selectedRole);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentRole(selectedRole);
    setSearchTerm("");
  }, [selectedRole]);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then((res) => {
        setUsers(res.data);
        setError(null);
      })
      .catch(() => setError("Failed to fetch users"))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = currentRole === "all" || user.role === currentRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId, newRole) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await updateUser(userId, { ...user, role: newRole });
      setUsers(users.map((u) => (u._id === userId ? data : u)));
    } catch {
      setError("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    // Implement if status is part of user schema and backend
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setLoading(true);
      const res = await deleteUser(userId);
      console.log('Delete user response:', res.data);
      setUsers(users.filter((u) => u._id !== userId));
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("User not found (404)");
      } else {
        setError("Failed to delete the user. Server error.");
      }
      console.error('Delete user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (userData) => {
    if (!userData._id) return;
    try {
      setLoading(true);
      const { data } = await updateUser(userData._id, userData);
      setUsers(users.map((u) => (u._id === userData._id ? data : u)));
      setShowUserModal(false);
      setSelectedUser(null);
      setError(null);
    } catch {
      setError("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="college">Colleges</option>
              <option value="hr">HRs</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm px-6">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    isAdmin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="student">Student</option>
                        <option value="college">College</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">{user.isAdmin ? "Yes" : "No"}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {/* Add status actions if needed */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUserModal && (
        <EditUser
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default UserList;
