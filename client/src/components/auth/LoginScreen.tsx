import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();

  // Mode: 'SIGNIN' | 'REGISTER' | 'FORGOT' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS'
  const [authMode, setAuthMode] = useState<'SIGNIN' | 'REGISTER' | 'FORGOT' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS'>('SIGNIN');

  // Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  // Forgot / Reset fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(292); // ~4m 52s

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Password criteria check
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(regPassword);
  const isRegPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  // Handle standard login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your email/phone and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration (Role is always CITIZEN from citizen registration)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTerms) {
      setError('You must accept the Civic Data Privacy & Public Service Terms.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isRegPasswordValid) {
      setError('Password does not meet municipal security criteria.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: 'CITIZEN'
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account may already exist with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setStatusMessage(`6-digit recovery code dispatched to ${forgotEmail}.`);
      setAuthMode('VERIFY_OTP');
    } catch (err: any) {
      setError(err.message || 'Unable to locate account with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otpDigits];
    updated[index] = val;
    setOtpDigits(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP Confirmation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit authentication code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP code.');

      setStatusMessage('Code verified. Set your new municipal password.');
      setAuthMode('RESET_PASSWORD');
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again or request a new code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.resetPassword({
        email: forgotEmail,
        otp: otpDigits.join(''),
        new_password: newPassword
      });
      setStatusMessage('Your password has been successfully updated.');
      setAuthMode('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please request a new recovery link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--civic-canvas)] flex flex-col justify-between antialiased selection:bg-[var(--civic-secondary-fixed)]">
      {/* Top Fixed Header */}
      <header className="w-full pt-safe bg-white/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[var(--civic-border)] z-40">
        <div className="h-16 px-4 max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="GrievanceGrid Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-[17px] text-[var(--civic-primary)] tracking-tight">GrievanceGrid</span>
          </div>
          <span className="text-[11px] font-semibold text-[var(--civic-secondary)] uppercase tracking-wider bg-[var(--civic-surface-dim)] px-2.5 py-1 rounded-full">
            Civic Portal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md w-full mx-auto">
        {/* Brand Crest */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center shadow-sm mb-3 relative">
            <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[28px]">account_balance</span>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--civic-secondary)] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[10px]">check</span>
            </div>
          </div>
          <h1 className="text-[24px] font-bold text-[var(--civic-primary)] tracking-tight">
            {authMode === 'SIGNIN' && 'Welcome back'}
            {authMode === 'REGISTER' && 'Create Civic Account'}
            {authMode === 'FORGOT' && 'Password Recovery'}
            {authMode === 'VERIFY_OTP' && 'Two-step Verification'}
            {authMode === 'RESET_PASSWORD' && 'Set New Password'}
            {authMode === 'SUCCESS' && 'Password Restored'}
          </h1>
          <p className="text-[14px] text-[var(--civic-text-muted)] mt-1">
            {authMode === 'SIGNIN' && 'Sign in to access your complaints and track municipal resolutions.'}
            {authMode === 'REGISTER' && 'Join your ward civic registry for verifiable complaint filings.'}
            {authMode === 'FORGOT' && 'Enter your verified email to receive restoration instructions.'}
            {authMode === 'VERIFY_OTP' && `We sent a 6-digit municipal code to ${forgotEmail || 'your email'}.`}
            {authMode === 'RESET_PASSWORD' && 'Choose a strong, secure password for your civic account.'}
            {authMode === 'SUCCESS' && 'Your credentials have been securely updated.'}
          </p>
        </div>

        {/* Global Error & Status Banners */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] text-[13px] flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-[#93000a] font-bold">&times;</button>
          </div>
        )}

        {statusMessage && (
          <div className="w-full mb-4 p-3 rounded-lg bg-[var(--civic-surface-dim)] border border-[var(--civic-secondary)]/20 text-[var(--civic-secondary)] text-[13px] flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
            <span className="flex-1">{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="font-bold">&times;</button>
          </div>
        )}

        {/* Card */}
        <div className="w-full bg-white rounded-xl shadow-md p-6 border border-[var(--civic-border)]">
          {/* ===================== 1. SIGN IN VIEW ===================== */}
          {authMode === 'SIGNIN' && (
            <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]" htmlFor="login-identifier">
                  Email or phone number
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--civic-text-muted)] text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. resident@ward4.org"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] placeholder:text-[var(--civic-text-muted)]/60 border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)] focus:ring-1 focus:ring-[var(--civic-secondary)] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-[var(--civic-primary)]" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAuthMode('FORGOT');
                    }}
                    className="text-[12px] text-[var(--civic-secondary)] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--civic-text-muted)] text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-10 pr-10 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] placeholder:text-[var(--civic-text-muted)]/60 border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)] focus:ring-1 focus:ring-[var(--civic-secondary)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)]"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)] cursor-pointer"
                  />
                  <span className="text-[13px] text-[var(--civic-text-muted)]">Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-[var(--civic-container)] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-[var(--civic-border)] mt-4">
                <p className="text-[13px] text-[var(--civic-text-muted)]">
                  New to GrievanceGrid?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAuthMode('REGISTER');
                    }}
                    className="text-[var(--civic-secondary)] font-semibold hover:underline ml-1"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ===================== 2. REGISTER VIEW ===================== */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="flex flex-col space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Elena Vance"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="elena@resident.org"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Phone Number</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 (555) 014-9921"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              {/* Password criteria chips */}
              <div className="grid grid-cols-2 gap-1.5 py-1 text-[11px]">
                <div className={`flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">{hasMinLength ? 'check_circle' : 'circle'}</span>
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">{hasUppercase ? 'check_circle' : 'circle'}</span>
                  <span>1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">{hasNumber ? 'check_circle' : 'circle'}</span>
                  <span>1 number</span>
                </div>
                <div className={`flex items-center gap-1 ${hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">{hasSpecial ? 'check_circle' : 'circle'}</span>
                  <span>1 special symbol</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
                />
                <span className="text-[12px] text-[var(--civic-text-muted)] leading-tight">
                  I agree to the Civic Grievance Public Integrity Code and Municipal Terms of Resolution.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !isRegPasswordValid || !regTerms}
                className="w-full h-11 rounded-lg bg-[var(--civic-secondary)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="pt-2 text-center border-t border-[var(--civic-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthMode('SIGNIN');
                  }}
                  className="text-[13px] text-[var(--civic-secondary)] font-medium hover:underline"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {/* ===================== 3. FORGOT PASSWORD VIEW ===================== */}
          {authMode === 'FORGOT' && (
            <form onSubmit={handleForgotPassword} className="flex flex-col space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--civic-text-muted)] text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthMode('SIGNIN');
                  }}
                  className="text-[13px] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ===================== 4. VERIFY OTP VIEW ===================== */}
          {authMode === 'VERIFY_OTP' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">
                  6-Digit Municipal Code
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-input-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="h-12 text-center font-mono text-[18px] font-bold rounded-lg bg-[var(--civic-canvas)] border border-[var(--civic-border)] text-[var(--civic-primary)] focus:outline-none focus:border-[var(--civic-secondary)] focus:ring-1 focus:ring-[var(--civic-secondary)]"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--civic-text-muted)]">Expires in 04:52</span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage('A fresh code has been sent.');
                  }}
                  className="text-[var(--civic-secondary)] font-medium hover:underline"
                >
                  Resend code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Confirm & Proceed'}
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthMode('SIGNIN');
                  }}
                  className="text-[13px] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium"
                >
                  Back to standard sign-in
                </button>
              </div>
            </form>
          )}

          {/* ===================== 5. RESET PASSWORD VIEW ===================== */}
          {authMode === 'RESET_PASSWORD' && (
            <form onSubmit={handleResetPassword} className="flex flex-col space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--civic-canvas)] text-[14px] border border-[var(--civic-border)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || newPassword !== confirmNewPassword}
                className="w-full h-11 rounded-lg bg-[var(--civic-secondary)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          {/* ===================== 6. SUCCESS VIEW ===================== */}
          {authMode === 'SUCCESS' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h2 className="text-[18px] font-bold text-[var(--civic-primary)]">Credentials Successfully Restored</h2>
              <p className="text-[13px] text-[var(--civic-text-muted)]">
                You can now sign in with your updated municipal security password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStatusMessage('');
                  setAuthMode('SIGNIN');
                }}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>

        {/* Civic Integrity Footer info */}
        <div className="mt-8 text-center text-[12px] text-[var(--civic-text-muted)]">
          <p>Official Civic Incident Intake • Municipal Operations</p>
          <p className="text-[11px] mt-1 opacity-75">Protected by Audit Logging & Service Standard SLA Monitoring</p>
        </div>
      </main>
    </div>
  );
};
