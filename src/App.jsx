import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import Requests from './pages/Requests';
import Cart from './pages/Cart';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './styles/App.css';

// Global overlay for login/logout so it appears on top of the login page
const AuthLoadingOverlay = () => {
  const { loggingIn, loggingOut } = useAuth();
  if (!loggingIn && !loggingOut) return null;
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="loading-text">
        {loggingOut ? 'Logging out...' : 'Logging in...'}
      </span>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" aria-hidden="true" />
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Admin Only Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" aria-hidden="true" />
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/admin" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AdminLogin />} 
      />
      <Route 
        path="/verify-email" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyEmail />} 
      />
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
      />
      <Route 
        path="/reset-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/items"
        element={
          <ProtectedRoute>
            <Layout>
              <Items />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <AdminRoute>
            <Layout>
              <Categories />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <AdminRoute>
            <Layout>
              <Transactions />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <Layout>
              <Requests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Layout>
              <Cart />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivityLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <AdminRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AuthLoadingOverlay />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
