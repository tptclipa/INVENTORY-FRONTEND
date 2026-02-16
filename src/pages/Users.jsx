import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdAdd, MdEdit, MdDelete, MdLock } from 'react-icons/md';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data.data);
    } catch (error) {
      setToast({ message: 'Error loading users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
    });
    setIsPasswordModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedUser) {
        // Update user - no password field in edit mode
        const updateData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        await usersAPI.update(selectedUser._id, updateData);
        setToast({ message: 'User updated successfully', type: 'success' });
      } else {
        // Create new user
        await usersAPI.create(formData);
        setToast({ message: 'User created successfully', type: 'success' });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      setToast({ message: error.message || 'Error saving user', type: 'error' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      await usersAPI.changePassword(selectedUser._id, {
        password: passwordData.newPassword,
      });
      setToast({ message: 'Password changed successfully', type: 'success' });
      setIsPasswordModalOpen(false);
    } catch (error) {
      setToast({ message: error.message || 'Error changing password', type: 'error' });
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      setToast({ message: 'User deleted successfully', type: 'success' });
      loadUsers();
    } catch (error) {
      setToast({ message: error.message || 'Error deleting user', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-icon-header btn-icon-primary" 
            onClick={handleAddUser}
            title="Add User"
          >
            <MdAdd size={22} />
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Admin Users</h3>
          <p className="stat-value">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="stat-card">
          <h3>Regular Users</h3>
          <p className="stat-value">{users.filter(u => u.role === 'user').length}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">
                  <div className="loading-inline loading-inline-center">
                    <div className="loading-spinner" aria-hidden="true" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.username}</strong>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <MdEdit
                        size={20}
                        className="action-icon action-icon-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit User"
                        style={{ cursor: 'pointer' }}
                      />
                      <MdLock
                        size={20}
                        className="action-icon action-icon-password"
                        onClick={() => handleChangePassword(user)}
                        title="Change Password"
                        style={{ cursor: 'pointer' }}
                      />
                      <MdDelete
                        size={20}
                        className="action-icon action-icon-delete"
                        onClick={() => handleDelete(user._id, user.username)}
                        title="Delete User"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleFormChange}
              required
              minLength={3}
              placeholder="Enter username (min 3 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              placeholder="Enter email address"
            />
          </div>

          {!selectedUser && (
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleFormChange}
                required
                minLength={6}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Change Password for ${selectedUser?.username}`}
      >
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
              placeholder="Re-enter new password"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Change Password
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Users;
