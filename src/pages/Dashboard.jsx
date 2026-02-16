import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsAPI, categoriesAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { MdCalendarToday, MdSchedule, MdInventory2, MdCategory, MdWarning, MdSwapHoriz, MdArrowForward } from 'react-icons/md';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCategories: 0,
    lowStockCount: 0,
    totalTransactions: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [toast, setToast] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [itemsData, categoriesData, lowStockData, transactionsData] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll(),
        itemsAPI.getLowStock(),
        transactionsAPI.getAll(),  // Now returns user's own transactions for regular users
      ]);

      setStats({
        totalItems: itemsData.count,
        totalCategories: categoriesData.count,
        lowStockCount: lowStockData.count,
        totalTransactions: transactionsData.count,
      });

      setLowStockItems(lowStockData.data);
      setRecentTransactions(transactionsData.data.slice(0, 5));
    } catch (error) {
      setToast({ message: 'Error loading dashboard data', type: 'error' });
    }
  };

  const formatDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return currentDateTime.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    return currentDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.name || user?.username || 'User';

  const getSubtitle = () => {
    if (isAdmin) {
      return 'Manage your inventory, track items, and oversee all operations';
    }
    return 'Browse items, place requests, and track your requests';
  };

  return (
    <div className="container">
      <div className="dashboard-welcome-card">
        <div className="welcome-content">
          <h1 className="welcome-greeting">{getGreeting()}, {displayName}!</h1>
          <p className="welcome-subtitle">{getSubtitle()}</p>
        </div>
        <div className="datetime-display">
          <div className="datetime-icon-wrap">
            <MdCalendarToday className="datetime-icon" aria-hidden />
            <span className="date-part">{formatDate()}</span>
          </div>
          <div className="datetime-icon-wrap">
            <MdSchedule className="datetime-icon" aria-hidden />
            <span className="time-part">{formatTime()}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card stat-card-items">
          <div className="stat-card-icon" aria-hidden>
            <MdInventory2 size={28} />
          </div>
          <div className="stat-card-body">
            <h3>Total Items</h3>
            <p className="stat-value">{stats.totalItems}</p>
          </div>
        </div>

        <div className="stat-card stat-card-categories">
          <div className="stat-card-icon" aria-hidden>
            <MdCategory size={28} />
          </div>
          <div className="stat-card-body">
            <h3>Total Categories</h3>
            <p className="stat-value">{stats.totalCategories}</p>
          </div>
        </div>

        <Link to="/items?lowStock=true" className="stat-card warning stat-card-action">
          <div className="stat-card-icon" aria-hidden>
            <MdWarning size={28} />
          </div>
          <div className="stat-card-body">
            <h3>Low Stock Items</h3>
            <p className="stat-value">{stats.lowStockCount}</p>
            <span className="stat-card-cta">View <MdArrowForward size={16} /></span>
          </div>
        </Link>

        <div className="stat-card stat-card-transactions">
          <div className="stat-card-icon" aria-hidden>
            <MdSwapHoriz size={28} />
          </div>
          <div className="stat-card-body">
            <h3>{isAdmin ? 'Total Transactions' : 'My Transactions'}</h3>
            <p className="stat-value">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>Low Stock Alerts</h3>
          <div className="items-list">
            {lowStockItems.length === 0 ? (
              <p>No low stock items</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item._id} className="item-row">
                  <span>{item.name}</span>
                  <span className="badge badge-warning">
                    Stock: {item.quantity}/{item.minStockLevel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h3>{isAdmin ? 'Recent Transactions' : 'My Recent Activity'}</h3>
          <div className="transactions-list">
            {recentTransactions.length === 0 ? (
              <p>No recent transactions</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="transaction-row">
                  <span>{transaction.item?.name || 'Unknown Item'}</span>
                  <span className={`badge ${transaction.type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                    {transaction.type === 'in' ? '+' : '-'}
                    {transaction.quantity}
                  </span>
                  <span className="date">{new Date(transaction.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Dashboard;
