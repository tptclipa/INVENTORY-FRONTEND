import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdLock, MdEmail } from 'react-icons/md';
import { LiaCopyright } from 'react-icons/lia';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await forgotPassword(email);
    
    if (result.success) {
      navigate('/reset-password', { state: { email } });
    } else {
      setError(result.message || 'Failed to send reset code');
    }
    
    setLoading(false);
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
            <div className="verify-icon">
              <MdLock size={64} color="#dc2626" />
            </div>
            <h1>Forgot Password?</h1>
            <p className="verify-subtitle">
              Enter your email address and we'll send you a code to reset your password.
            </p>

            {error && <div className="error-message show">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>

            <p className="register-link">
              Remember your password? <Link to="/">Login here</Link>
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

export default ForgotPassword;
