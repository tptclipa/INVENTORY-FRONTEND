import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiaCopyright } from 'react-icons/lia';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      const result = await register(formData);
      if (result.success) {
        // Redirect to email verification page
        navigate('/verify-email', { state: { email: result.email } });
      } else {
        setError(result.message);
      }
    } else {
      const result = await login({ username: formData.username, password: formData.password });
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {!isRegister ? (
          <div className="login-card">
            <div className="login-logo-section">
              <img src="/Untitled design (2).png" alt="TESDA Logo" className="login-logo" />
              <h1>Inventory Management System</h1>
            </div>
            <div className="login-form-section">
              <h1>Inventory Management System</h1>
              <h2>Login</h2>

              {error && <div className="error-message show">{error}</div>}

              <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Login
              </button>
              </form>

              <p className="register-link">
                <Link to="/forgot-password">Forgot password?</Link>
              </p>

              <p className="register-link">
                Don't have an account?{' '}
                <a href="#" onClick={() => setIsRegister(true)}>
                  Register here
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="register-card">
            <div className="login-logo-section">
              <img src="/Untitled design (2).png" alt="TESDA Logo" className="login-logo" />
              <h1>Inventory Management System</h1>
            </div>
            <div className="login-form-section">
              <h1>Inventory Management System</h1>
              <h2>Register</h2>

              {error && <div className="error-message show">{error}</div>}

              <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Register
              </button>
              </form>

              <p className="register-link">
                Already have an account?{' '}
                <a href="#" onClick={() => setIsRegister(false)}>
                  Login here
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <Link to="/admin" className="footer-link">
          <p><LiaCopyright /> TESDA PTC 2026</p>
        </Link>
      </footer>
    </div>
  );
};

export default Login;
