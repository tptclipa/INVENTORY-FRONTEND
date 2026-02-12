import { useState, useEffect } from 'react';
import { activityLogsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { MdRefresh, MdClear } from 'react-icons/md';

const ActivityLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadLogs();
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      console.log('Users loaded:', data.data);
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ message: 'Error loading users list', type: 'error' });
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogsAPI.getAll({});
      setLogs(data.data);
    } catch (error) {
      setToast({ message: 'Error loading activity logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await activityLogsAPI.getStats();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    setFilters(newFilters);
    
    // Automatically apply filters
    applyFilters(newFilters);
  };

  const applyFilters = async (filterParams) => {
    try {
      setLoading(true);
      const params = {};
      if (filterParams.action) params.action = filterParams.action;
      if (filterParams.resourceType) params.resourceType = filterParams.resourceType;
      if (filterParams.userId) params.userId = filterParams.userId;
      if (filterParams.startDate) params.startDate = filterParams.startDate;
      if (filterParams.endDate) params.endDate = filterParams.endDate;

      const data = await activityLogsAPI.getAll(params);
      setLogs(data.data);
    } catch (error) {
      setToast({ message: 'Error loading activity logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      action: '',
      resourceType: '',
      userId: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  const handleRefresh = () => {
    applyFilters(filters);
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatAction = (action) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActionBadgeClass = (action) => {
    if (action === 'login') return 'badge-success';
    if (action === 'logout') return 'badge-secondary';
    if (action.includes('delete')) return 'badge-danger';
    if (action.includes('create')) return 'badge-primary';
    if (action.includes('update')) return 'badge-warning';
    if (action.includes('approve')) return 'badge-success';
    if (action.includes('reject')) return 'badge-danger';
    return 'badge-info';
  };

  const calculateTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isAdmin ? 'All Activity Logs' : 'My Activity Logs'}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <MdRefresh size={20} />
            Refresh
          </button>
        </div>
      </div>

      {isAdmin && stats && (
        <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total Logs</h3>
            <p className="stat-value">{stats.totalLogs}</p>
          </div>
          <div className="stat-card warning">
            <h3>Expiring Soon</h3>
            <p className="stat-value">{stats.expiringLogs}</p>
            <small>Within 3 days</small>
          </div>
          <div className="stat-card">
            <h3>Retention Period</h3>
            <p className="stat-value">3 Weeks</p>
            <small>Auto-cleanup enabled</small>
          </div>
        </div>
      )}

      <div className="filters">
        <select name="action" value={filters.action} onChange={handleFilterChange}>
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create_item">Create Item</option>
          <option value="update_item">Update Item</option>
          <option value="delete_item">Delete Item</option>
          <option value="create_transaction">Create Transaction</option>
          <option value="create_request">Create Request</option>
          <option value="approve_request">Approve Request</option>
          <option value="reject_request">Reject Request</option>
          <option value="generate_report">Generate Report</option>
          <option value="export_data">Export Data</option>
        </select>
        
        <select name="resourceType" value={filters.resourceType} onChange={handleFilterChange}>
          <option value="">All Resource Types</option>
          <option value="item">Item</option>
          <option value="category">Category</option>
          <option value="transaction">Transaction</option>
          <option value="request">Request</option>
          <option value="report">Report</option>
          <option value="system">System</option>
        </select>

        {isAdmin && (
          <select name="userId" value={filters.userId} onChange={handleFilterChange}>
            <option value="">All Users</option>
            {users.length > 0 ? (
              users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.name}) - {user.role}
                </option>
              ))
            ) : (
              <option value="" disabled>Loading users...</option>
            )}
          </select>
        )}

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="Start Date"
        />
        
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="End Date"
        />
        
        <button className="btn btn-secondary" onClick={handleClearFilters}>
          <MdClear size={18} />
          Clear
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              {isAdmin && <th>User</th>}
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center">
                  No activity logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDate(log.createdAt)}</td>
                  {isAdmin && (
                    <td>
                      <strong>{log.user?.username || 'Unknown'}</strong>
                      {log.user?.name && (
                        <small style={{ display: 'block', color: '#666' }}>
                          {log.user.name}
                        </small>
                      )}
                    </td>
                  )}
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {log.resourceType}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '400px' }}>
                      {log.details}
                    </div>
                  </td>
                  <td>
                    <small style={{ 
                      color: new Date(log.expiresAt) - new Date() < 3 * 24 * 60 * 60 * 1000 ? '#ff9800' : '#666' 
                    }}>
                      {calculateTimeRemaining(log.expiresAt)}
                    </small>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ActivityLogs;
