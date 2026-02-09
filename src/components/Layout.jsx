import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { LiaCopyright } from 'react-icons/lia';
import { MdDashboard, MdInventory, MdCategory, MdSwapHoriz, MdLogout, MdAssignment, MdShoppingCart, MdDarkMode, MdLightMode } from 'react-icons/md';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartTotal } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const cartTotal = getCartTotal();

  return (
    <div className="app-layout-sidebar">
      {/* Side Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img 
            src="/Untitled design (2).png" 
            alt="TESDA Logo" 
            className="sidebar-logo"
          />
          <h1 className="sidebar-brand">INVENTORY</h1>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <MdDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/items" className={`sidebar-link ${isActive('/items') ? 'active' : ''}`}>
            <MdInventory size={20} />
            <span>{isAdmin ? 'Items' : 'View Stock'}</span>
          </Link>
          {isAdmin && (
            <Link to="/categories" className={`sidebar-link ${isActive('/categories') ? 'active' : ''}`}>
              <MdCategory size={20} />
              <span>Categories</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/transactions" className={`sidebar-link ${isActive('/transactions') ? 'active' : ''}`}>
              <MdSwapHoriz size={20} />
              <span>Transactions</span>
            </Link>
          )}
          <Link to="/requests" className={`sidebar-link ${isActive('/requests') ? 'active' : ''}`}>
            <MdAssignment size={20} />
            <span>{isAdmin ? 'Manage Requests' : 'My Requests'}</span>
          </Link>
          {!isAdmin && (
            <Link to="/cart" className={`sidebar-link ${isActive('/cart') ? 'active' : ''}`}>
              <MdShoppingCart size={20} />
              <span>Cart</span>
              {cartTotal > 0 && (
                <span className="cart-badge">{cartTotal}</span>
              )}
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="sidebar-theme-btn">
            {isDarkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={logout} className="sidebar-logout-btn">
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
          <Link to="/admin" className="footer-link-sidebar">
            <LiaCopyright size={16} />
            <span>TESDA PTC 2026</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <main className="main-content-sidebar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
