import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Toast from '../components/Toast';
import { MdPerson, MdLock, MdEmail, MdAccountCircle, MdLogout, MdEdit, MdMoreVert, MdInfo } from 'react-icons/md';

const Profile = () => {
  const { user, logout } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('info'); // 'info', 'edit', 'password'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersAPI.update(user._id, profileData);
      
      // Update user in localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setToast({ message: 'Profile updated successfully', type: 'success' });
      setActiveView('info');
      
      // Reload page to update the user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setToast({ message: error.message || 'Error updating profile', type: 'error' });
    } finally {
      setLoading(false);
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

    setLoading(true);

    try {
      await usersAPI.changeOwnPassword({
        password: passwordData.newPassword,
      });
      
      setToast({ message: 'Password changed successfully', type: 'success' });
      setActiveView('info');
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setToast({ message: error.message || 'Error changing password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setActiveView('info');
    setProfileData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
    });
  };

  const handleCancelPasswordChange = () => {
    setActiveView('info');
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-menu-container">
        {/* Main Profile Card */}
        <div className="profile-menu-card">
          {/* User Info Section */}
          <div className="profile-menu-user">
            <div className="profile-menu-avatar">
              <MdAccountCircle size={48} />
            </div>
            <div className="profile-menu-info">
              <div className="profile-menu-name">{user?.name}</div>
              <div className="profile-menu-username">@{user?.username}</div>
            </div>
            <button className="profile-menu-more">
              <MdMoreVert size={20} />
            </button>
          </div>

          {/* Divider */}
          <div className="profile-menu-divider"></div>

          {/* Menu Options */}
          <div className="profile-menu-options">
            <button 
              className={`profile-menu-option ${activeView === 'info' ? 'active' : ''}`}
              onClick={() => setActiveView('info')}
            >
              <MdInfo size={20} />
              <span>View Profile</span>
            </button>
            <button 
              className={`profile-menu-option ${activeView === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveView('edit')}
            >
              <MdEdit size={20} />
              <span>Edit Profile</span>
            </button>
            <button 
              className={`profile-menu-option ${activeView === 'password' ? 'active' : ''}`}
              onClick={() => setActiveView('password')}
            >
              <MdLock size={20} />
              <span>Change Password</span>
            </button>
          </div>

          {/* Divider */}
          <div className="profile-menu-divider"></div>

          {/* Logout Option */}
          <button 
            className="profile-menu-option profile-menu-logout"
            onClick={handleLogout}
          >
            <MdLogout size={20} />
            <span>Log out</span>
          </button>
        </div>

        {/* Right Side Content - Dynamic Based on Active View */}
        <div className="profile-info-card">
          {/* Account Information View */}
          {activeView === 'info' && (
            <>
              <div className="profile-info-header">
                <h3>Account Information</h3>
              </div>
              <div className="profile-info-list">
                <div className="profile-info-row">
                  <span className="profile-info-label">Full Name</span>
                  <span className="profile-info-value">{user?.name}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Username</span>
                  <span className="profile-info-value">@{user?.username}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{user?.email}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Role</span>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Member Since</span>
                  <span className="profile-info-value">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                </div>
              </div>
            </>
          )}

          {/* Edit Profile View */}
          {activeView === 'edit' && (
            <>
              <div className="profile-info-header">
                <h3>Edit Profile</h3>
                <button className="profile-back-btn" onClick={() => setActiveView('info')}>×</button>
              </div>
              <div className="profile-form-container">
                <form onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
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
                      value={profileData.username}
                      onChange={handleProfileChange}
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
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* Change Password View */}
          {activeView === 'password' && (
            <>
              <div className="profile-info-header">
                <h3>Change Password</h3>
                <button className="profile-back-btn" onClick={() => setActiveView('info')}>×</button>
              </div>
              <div className="profile-form-container">
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
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelPasswordChange}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="confirm-modal-overlay" onClick={cancelLogout}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h3>TESDA INVENTORY</h3>
            </div>
            <div className="confirm-modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="confirm-modal-actions">
              <button className="btn btn-primary" onClick={confirmLogout}>
                OK
              </button>
              <button className="btn btn-secondary" onClick={cancelLogout}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
