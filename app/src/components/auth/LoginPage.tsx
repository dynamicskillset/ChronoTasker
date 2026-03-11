import { useState, useEffect, type FormEvent } from 'react';
import { login, register, forgotPassword, resetPassword } from '../../services/api';
import type { AuthUser } from '../../services/auth';

interface LoginPageProps {
  onSuccess: (user: AuthUser) => void;
  expired?: boolean;
  resetToken?: string | null;
}

export default function LoginPage({ onSuccess, expired = false, resetToken }: LoginPageProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    resetToken ? 'reset' : 'login'
  );

  useEffect(() => {
    if (resetToken) setView('reset');
  }, [resetToken]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password || !inviteCode) {
      setError('All fields are required');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!/^[A-Za-z0-9]{8}$/.test(inviteCode)) {
      setError('Invite code must be 8 letters or numbers');
      return;
    }

    setLoading(true);
    try {
      const user = await register(email, password, inviteCode);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setView('login');
      // Reuse error state as a success notice
      setError('__sent__');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('New password is required');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    if (!resetToken) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      window.history.replaceState({}, '', '/');
      setView('login');
      setPassword('');
      setError('__reset__');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  }

  function switchView(next: 'login' | 'register' | 'forgot') {
    setView(next);
    setError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">TaskDial</h1>
          <p className="auth-tagline">Plan your day visually</p>
        </div>

        {expired && (
          <p className="auth-notice">Your session has expired. Please log in again.</p>
        )}
        {error === '__sent__' && (
          <p className="auth-notice">If that email is registered, you'll receive a reset link shortly.</p>
        )}
        {error === '__reset__' && (
          <p className="auth-notice">Your password has been reset. Please log in with your new password.</p>
        )}

        {view === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <h2 className="auth-form__title">Log in</h2>

            <div className="auth-field">
              <label htmlFor="login-email" className="auth-field__label">Email</label>
              <input
                id="login-email"
                type="email"
                className="auth-field__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <div className="auth-field__label-row">
                <label htmlFor="login-password" className="auth-field__label">Password</label>
                <button
                  type="button"
                  className="auth-switch__link auth-field__forgot"
                  onClick={() => switchView('forgot')}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                className="auth-field__input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && error !== '__sent__' && error !== '__reset__' && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>

            <p className="auth-switch">
              Have an invite code?{' '}
              <button type="button" className="auth-switch__link" onClick={() => switchView('register')}>
                Create account
              </button>
            </p>
          </form>
        ) : view === 'forgot' ? (
          <form className="auth-form" onSubmit={handleForgotPassword} noValidate>
            <h2 className="auth-form__title">Reset password</h2>
            <p className="auth-form__desc">Enter your email address and we'll send you a reset link.</p>

            <div className="auth-field">
              <label htmlFor="forgot-email" className="auth-field__label">Email</label>
              <input
                id="forgot-email"
                type="email"
                className="auth-field__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && error !== '__sent__' && error !== '__reset__' && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="auth-switch">
              <button type="button" className="auth-switch__link" onClick={() => switchView('login')}>
                Back to log in
              </button>
            </p>
          </form>
        ) : view === 'reset' ? (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <h2 className="auth-form__title">Choose a new password</h2>

            <div className="auth-field">
              <label htmlFor="reset-password" className="auth-field__label">
                New password <span className="auth-field__hint">(12 characters minimum)</span>
              </label>
              <input
                id="reset-password"
                type="password"
                className="auth-field__input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <p className="auth-notice auth-notice--warn">
              Note: resetting your password will sign you out of all devices. Any encrypted task data
              will no longer be readable, as the encryption key is derived from your password.
            </p>

            {error && error !== '__sent__' && error !== '__reset__' && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <h2 className="auth-form__title">Create account</h2>

            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-field__label">Email</label>
              <input
                id="reg-email"
                type="email"
                className="auth-field__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-field__label">
                Password <span className="auth-field__hint">(12 characters minimum)</span>
              </label>
              <input
                id="reg-password"
                type="password"
                className="auth-field__input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-invite" className="auth-field__label">Invite code</label>
              <input
                id="reg-invite"
                type="text"
                className="auth-field__input auth-field__input--mono"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {error && error !== '__sent__' && error !== '__reset__' && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-switch__link" onClick={() => switchView('login')}>
                Log in
              </button>
            </p>
          </form>
        )}

        <p className="auth-privacy-notice">
          By using TaskDial you agree to our{' '}
          <a href="/privacy" className="auth-privacy-notice__link">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
