import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdLock, MdCheck } from 'react-icons/md';
import { LiaCopyright } from 'react-icons/lia';

const ResetPassword = () => {
  const [step, setStep] = useState(1); // 1: enter code, 2: enter new password
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { verifyResetCode, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleCodeChange = (index, value) => {
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

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const resetCode = code.join('');

    if (resetCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyResetCode(email, resetCode);
    
    if (result.success) {
      setStep(2);
    } else {
      setError(result.message || 'Invalid reset code');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const resetCode = code.join('');
    const result = await resetPassword(email, resetCode, newPassword);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setError(result.message || 'Failed to reset password');
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
              {success ? <MdCheck size={64} color="#10b981" /> : <MdLock size={64} color="#dc2626" />}
            </div>
            
            {step === 1 ? (
              <>
                <h1>Enter Reset Code</h1>
                <p className="verify-subtitle">
                  We've sent a 6-digit code to<br />
                  <strong>{email}</strong>
                </p>

                {error && <div className="error-message show">{error}</div>}

                <form onSubmit={handleVerifyCode}>
                  <div className="code-input-group">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="code-input"
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1>Create New Password</h1>
                <p className="verify-subtitle">
                  Enter your new password below
                </p>

                {error && <div className="error-message show">{error}</div>}
                {success && <div className="success-message show">Password reset successfully!</div>}

                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Enter new password (min 6 characters)"
                      disabled={loading || success}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      disabled={loading || success}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading || success}
                  >
                    {loading ? 'Resetting...' : success ? 'Success!' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

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

export default ResetPassword;
