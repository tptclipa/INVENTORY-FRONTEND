import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // New flow: registration returns success with email, not token
      return { 
        success: true, 
        email: response.data.email,
        message: response.message 
      };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await authAPI.verifyEmail(email, code);
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Verification failed' };
    }
  };

  const resendVerification = async (email) => {
    try {
      await authAPI.resendVerification(email);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to resend code' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to send reset code' };
    }
  };

  const verifyResetCode = async (email, code) => {
    try {
      await authAPI.verifyResetCode(email, code);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid reset code' };
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      await authAPI.resetPassword(email, code, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  };

  const logout = async () => {
    try {
      // Call backend to log the logout activity
      await authAPI.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Clear local storage and user state regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
