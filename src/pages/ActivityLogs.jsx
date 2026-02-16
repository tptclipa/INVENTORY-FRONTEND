import { useState, useEffect } from 'react';
import { activityLogsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { MdRefresh, MdClear, MdChevronLeft, MdChevronRight, MdFilterList } from 'react-icons/md';

const ActivityLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadLogs();
    if (isAdmin) {
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


  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Automatically apply filters
    applyFilters(newFilters);
  };

  const applyFilters = async (filterParams) => {
    try {
      setLoading(true);
      const params = {};
      if (filterParams.action) params.action = filterParams.action;
      if (filterParams.userId) params.userId = filterParams.userId;
      if (filterParams.startDate) params.startDate = filterParams.startDate;
      if (filterParams.endDate) params.endDate = filterParams.endDate;

      const data = await activityLogsAPI.getAll(params);
      setLogs(data.data);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      setToast({ message: 'Error loading activity logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      action: '',
      userId: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    setCurrentPage(1); // Reset to first page
    applyFilters(clearedFilters);
  };

  const handleRefresh = () => {
    applyFilters(filters);
    if (isAdmin) {
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

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 3;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 3 pages centered around current page
      let startPage = currentPage - 1;
      let endPage = currentPage + 1;
      
      // Adjust if we're at the beginning
      if (currentPage === 1) {
        startPage = 1;
        endPage = 3;
      } else if (currentPage === totalPages) {
        // Adjust if we're at the end
        startPage = totalPages - 2;
        endPage = totalPages;
      }
      
      // Make sure we don't go below 1 or above totalPages
      startPage = Math.max(1, startPage);
      endPage = Math.min(totalPages, endPage);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div>
      <div className="page-header">
        <h2>{isAdmin ? 'Activity Logs' : 'My Activity Logs'}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? 'Hide filters' : 'Show filters'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MdFilterList size={20} />
            Filters
          </button>
          <button
            type="button"
            className="btn-icon-header btn-icon-secondary"
            onClick={handleRefresh}
            title="Refresh"
          >
            <MdRefresh size={22} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="activity-logs-filters-panel">
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

            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
              <MdClear size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="table-container activity-logs-table-wrap">
        <table className="data-table activity-logs-table">
          <thead>
            <tr>
              <th className="activity-logs-th-date">Date & Time</th>
              {isAdmin && <th className="activity-logs-th-user">User</th>}
              <th className="activity-logs-th-action">Action</th>
              <th className="activity-logs-th-details">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center">
                  <div className="loading-inline loading-inline-center">
                    <div className="loading-spinner" aria-hidden="true" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center">
                  No activity logs found
                </td>
              </tr>
            ) : (
              currentLogs.map((log) => (
                <tr key={log._id}>
                  <td className="activity-logs-td-date">{formatDate(log.createdAt)}</td>
                  {isAdmin && (
                    <td className="activity-logs-td-user">
                      <strong>{log.user?.username || 'Unknown'}</strong>
                      {log.user?.name && (
                        <small className="activity-logs-user-name">
                          {log.user.name}
                        </small>
                      )}
                    </td>
                  )}
                  <td className="activity-logs-td-action">
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="activity-logs-td-details">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {logs.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-controls">
            <button
              className="pagination-btn arrow"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <MdChevronLeft size={22} />
            </button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                  title={`Page ${page}`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              className="pagination-btn arrow"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <MdChevronRight size={22} />
            </button>
          </div>

          <div className="pagination-info">
            <span>
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, logs.length)} of {logs.length}
            </span>
            <select 
              value={itemsPerPage} 
              onChange={handleItemsPerPageChange}
              className="pagination-select"
              title="Items per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ActivityLogs;
