import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdVerified } from 'react-icons/md';
import { LiaCopyright } from 'react-icons/lia';

const VerifyEmail = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('');
    setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyEmail(email, verificationCode);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(result.message || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    }
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    
    const result = await resendVerification(email);
    
    if (result.success) {
      setError('');
      alert('Verification code sent! Check your email.');
    } else {
      setError(result.message || 'Failed to resend code');
    }
    
    setResending(false);
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
              {success ? <MdVerified size={64} color="#10b981" /> : <MdEmail size={64} color="#2563eb" />}
            </div>
            <h1>Verify Your Email</h1>
            <p className="verify-subtitle">
              We've sent a 6-digit code to<br />
              <strong>{email}</strong>
            </p>

            {error && <div className="error-message show">{error}</div>}
            {success && <div className="success-message show">Email verified successfully!</div>}

            <form onSubmit={handleSubmit}>
              <div className="code-input-group">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="code-input"
                    disabled={loading || success}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || success}
              >
                {loading ? 'Verifying...' : success ? 'Verified!' : 'Verify Email'}
              </button>
            </form>

            <div className="verify-actions">
              <p>Didn't receive the code?</p>
              <button 
                onClick={handleResendCode} 
                className="link-button"
                disabled={resending || success}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            <p className="register-link">
              <Link to="/">Back to Login</Link>
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

export default VerifyEmail;
