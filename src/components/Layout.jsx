import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { LiaCopyright } from 'react-icons/lia';
import { MdDashboard, MdInventory, MdCategory, MdSwapHoriz, MdAssignment, MdShoppingCart, MdDarkMode, MdLightMode, MdBrightnessAuto, MdPeople, MdHistory, MdAccountCircle, MdMenu } from 'react-icons/md';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartTotal } = useCart();
  const { themeMode, cycleTheme, isDarkMode, themes } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const cartTotal = getCartTotal();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className={`app-layout-sidebar ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
      {/* Backdrop when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => e.key === 'Enter' && setMobileMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      {/* Side Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img 
            src="/Untitled design (2).png" 
            alt="TESDA Logo" 
            className="sidebar-logo"
          />
          {isAdmin ? (
            <div className="sidebar-brand-admin-wrap">
              <span className="sidebar-brand-admin-tag">admin</span>
              <h1 className="sidebar-brand">INVENTORY</h1>
            </div>
          ) : (
            <h1 className="sidebar-brand">INVENTORY</h1>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <MdDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/items" className={`sidebar-link ${isActive('/items') ? 'active' : ''}`}>
            <MdInventory size={20} />
            <span>{isAdmin ? 'Stocks' : 'View Items'}</span>
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
              <span>All Transactions</span>
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
          {!isAdmin && (
            <Link to="/activity-logs" className={`sidebar-link ${isActive('/activity-logs') ? 'active' : ''}`}>
              <MdHistory size={20} />
              <span>My Activity</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/user-management" className={`sidebar-link ${isActive('/user-management') ? 'active' : ''}`}>
              <MdPeople size={20} />
              <span>User Management</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-profile-btn">
            <MdAccountCircle size={20} />
            <span>My Profile</span>
          </Link>
          <button onClick={cycleTheme} className="sidebar-theme-btn" title={`Theme: ${themeMode} (click to cycle)`} aria-label={`Theme: ${themeMode}`}>
            {themeMode === themes.LIGHT && <MdLightMode size={20} />}
            {themeMode === themes.DARK && <MdDarkMode size={20} />}
            {themeMode === themes.SYSTEM && <MdBrightnessAuto size={20} />}
            <span>
              {themeMode === themes.LIGHT && 'Light'}
              {themeMode === themes.DARK && 'Dark'}
              {themeMode === themes.SYSTEM && (isDarkMode ? 'System (Dark)' : 'System (Light)')}
            </span>
          </button>
          <Link to="/admin" className="footer-link-sidebar">
            <LiaCopyright size={16} />
            <span>TESDA PTC 2026</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <div className="app-top-banner">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <MdMenu size={24} />
          </button>
          <img
            src="/tesda name logo.png"
            alt="TESDA"
            className="app-top-banner-logo"
          />
        </div>
        <main className={`main-content-sidebar${location.pathname === '/activity-logs' ? ' main-content-sidebar--activity-logs' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
