import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const EyeIcon = ({ show }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    {show
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    }
  </svg>
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Forgot Password / Reset Password states
  const [resetMode, setResetMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/student');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!recoveryUser) { toast.error('Username is required'); return; }
    setResetLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password/', { username: recoveryUser });
      toast.success(res.data.message || 'Verification OTP sent!');
      setMaskedEmail(res.data.email || 'your registered email');
      setOtpSent(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Verification failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setResetLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password-otp/', {
        username: recoveryUser,
        otp: otpCode,
        new_password: newPassword
      });
      toast.success(res.data.message || 'Password updated successfully!');
      setResetMode(false);
      setOtpSent(false);
      setUsername(recoveryUser);
      setPassword('');
      setRecoveryUser('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'OTP verification failed');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Column: Branding and Info */}
      <div className="login-brand-side">
        <div className="login-brand-container animate-fade-in">
          <div className="login-brand-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="login-brand-badge">Academic Portal</span>
          <h1>Assessment Manager</h1>
          <p className="login-brand-desc">
            An enterprise-grade internal evaluation and student assessment records management system. Designed to streamline academic progress tracking, marks distribution calculations, and institutional report generation for administrators, tutors, and students.
          </p>
          <div className="login-brand-features">
            <div className="login-brand-feat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Configurable internal assessment schemes</span>
            </div>
            <div className="login-brand-feat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Academic promotion and term management</span>
            </div>
            <div className="login-brand-feat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Comprehensive student evaluation analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form Side */}
      <div className="login-form-side">
        <div className="login-card-wrap animate-slide-up">
          {!resetMode ? (
            <>
              <div className="login-form-header">
                <h2>Sign In</h2>
                <p>Enter your credentials to access the system</p>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    id="username-input"
                    className="form-input"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setResetMode(true); setOtpSent(false); setRecoveryUser(username); }}
                      style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password-input"
                      className="form-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingRight: 42 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(0,0,0,0.35)', cursor: 'pointer', padding: 2, display: 'flex' }}
                    >
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                </div>

                <button
                  id="login-btn"
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Signing in...</>
                    : 'Sign In'
                  }
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Reset Password Flow */}
              {!otpSent ? (
                <>
                  <div className="login-form-header">
                    <h2>Recover Password</h2>
                    <p>Enter your username to request an OTP code to your recovery email</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="login-form">
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Enter username"
                        value={recoveryUser}
                        onChange={e => setRecoveryUser(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="login-submit"
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => setResetMode(false)}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 13, marginTop: 10, border: '1px solid rgba(0,0,0,0.08)' }}
                    >
                      Back to Sign In
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="login-form-header">
                    <h2>Verify OTP</h2>
                    <p>Enter code sent to recovery email: <strong>{maskedEmail}</strong></p>
                  </div>

                  <form onSubmit={handleVerifyAndReset} className="login-form">
                    <div className="form-group">
                      <label className="form-label">OTP Verification Code</label>
                      <input
                        className="form-input"
                        type="text"
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18, fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Confirm"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="login-submit"
                      style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)' }}
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Resetting Password...' : 'Verify & Reset Password'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => setOtpSent(false)}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 13, marginTop: 10, border: '1px solid rgba(0,0,0,0.08)' }}
                    >
                      Change Username
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          <div className="login-card-footer">
            Internal Assessment Manager • Protected Access Area
          </div>
        </div>
      </div>
    </div>
  );
}
