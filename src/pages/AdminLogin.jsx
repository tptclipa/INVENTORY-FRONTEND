import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiaCopyright } from 'react-icons/lia';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../services/api';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Call a special admin login endpoint with just password
      const response = await api.post('/auth/admin-login', { password });
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Reload the page to trigger AuthContext to pick up the new user
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message || 'Invalid admin password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-section">
            <img src="/Untitled design (2).png" alt="TESDA Logo" className="login-logo" />
            <h1>Inventory Management System</h1>
          </div>
          <div className="login-form-section">
            <h1>Inventory Management System</h1>
            <h2>Admin Login - Track Inventory</h2>

            {error && <div className="error-message show">{error}</div>}

            <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin password"
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Access Admin Panel
            </button>
            </form>

            <p className="register-link">
              Regular user?{' '}
              <Link to="/">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p><LiaCopyright /> TESDA PTC 2026</p>
      </footer>
    </div>
  );
};

export default AdminLogin;
