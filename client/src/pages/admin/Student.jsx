import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import EditUser from './EditUser';

const Student = ({ setShowUserModal, setSelectedUser, showUserModal, selectedUser, selectedRole = 'all' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRole, setCurrentRole] = useState(selectedRole);
  
  // Reset both role and search when selectedRole prop changes
  useEffect(() => {
    setCurrentRole(selectedRole);
    setSearchTerm(''); // Reset search term when role changes
  }, [selectedRole]);

  const [users, setUsers] = useState([
    {
      id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', college: 'MIT',
      phone: '+1234567890', location: 'Cambridge, MA', status: 'active', joinDate: '2024-01-15', lastActive: '2025-06-05'
    },
    {
      id: 2, name: 'Jane Smith', email: 'jane@college.edu', role: 'college', company: 'Harvard University',
      phone: '+1234567891', location: 'Boston, MA', status: 'pending', joinDate: '2024-03-20', lastActive: '2025-06-04'
    },
    {
      id: 3, name: 'Mike Johnson', email: 'mike@techcorp.com', role: 'hr', company: 'TechCorp Inc.',
      phone: '+1234567892', location: 'San Francisco, CA', status: 'active', joinDate: '2024-02-10', lastActive: '2025-06-05'
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = currentRole === 'all' || user.role === currentRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
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

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-700">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="student">Student</option>
                      <option value="college">College</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.lastActive}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="text-blue-600 hover:text-blue-900">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {user.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(user.id, 'active')} className="text-green-600 hover:text-green-900">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleStatusChange(user.id, 'suspended')} className="text-red-600 hover:text-red-900">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <EditUser
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={(userData) => {
            if (selectedUser) {
              setUsers(users.map(user => user.id === selectedUser.id ? { ...user, ...userData } : user));
            } else {
              setUsers([...users, { ...userData, id: Date.now() }]);
            }
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default Student;
