import React, { useState } from 'react';
import { Film, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface LoginProps {
  navigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ navigate }) => {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const { trackAuth } = useAnalytics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const sanitizeRedirect = (url: string | null): string => {
    if (!url) return '/';
    if (url.startsWith('/') && !url.startsWith('//') && !url.toLowerCase().includes('javascript:')) {
      return url;
    }
    return '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please provide both email and password', 'error');
      return;
    }

    setLoading(true);
    const { error, role } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      showToast(error.message || 'Failed to sign in', 'error');
    } else {
      trackAuth('login', 'email_password');
      showToast('Signed in successfully', 'success');
      // Role-based routing according to specifications:
      // USER -> User Panel / Video Library (/) or redirect
      // ADMIN -> Dedicated /admin portal
      // MANAGER -> Dedicated /manager portal
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'manager') {
        navigate('/manager');
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const queryRedirect = urlParams.get('redirect');
        const storedRedirect = sessionStorage.getItem('STREAMVAULT_REDIRECT_URL');
        const rawRedirect = queryRedirect || storedRedirect;
        sessionStorage.removeItem('STREAMVAULT_REDIRECT_URL');
        const safeRedirect = sanitizeRedirect(rawRedirect);
        navigate(safeRedirect || '/');
      }
    }
  };

  return (
    <div id="login-page" className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md border p-8 shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--color-surface, #11131d)',
          borderColor: 'var(--color-border, #1e2233)',
          borderRadius: 'var(--card-radius, 24px)',
          boxShadow: 'var(--card-shadow, 0 20px 40px -15px rgba(0,0,0,0.6))',
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-12 h-12 rounded-2xl items-center justify-center shadow-lg mb-3 text-white"
            style={{
              backgroundColor: 'var(--color-primary, #e11d48)',
            }}
          >
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--color-text, #ffffff)' }}
          >
            StreamVault
          </h1>
          <p
            className="text-sm font-semibold mt-1"
            style={{ color: 'var(--color-text, #ffffff)' }}
          >
            Welcome Back
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-muted, #94a3b8)' }}
          >
            Sign in to your StreamVault account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                required
                placeholder="name@streamvault.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background, #181a26)',
                  borderColor: 'var(--color-input-border, #2a2f42)',
                  borderRadius: 'var(--input-radius, 12px)',
                  color: 'var(--color-text, #ffffff)',
                }}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted, #94a3b8)' }}
              >
                Password
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: 'var(--color-primary, #e11d48)' }}
                >
                  Forgot Password
                </button>
                <button
                  type="button"
                  id="toggle-login-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border pl-10 pr-10 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background, #181a26)',
                  borderColor: 'var(--color-input-border, #2a2f42)',
                  borderRadius: 'var(--input-radius, 12px)',
                  color: 'var(--color-text, #ffffff)',
                }}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Remember session */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
              <input
                id="login-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 focus:ring-0 cursor-pointer"
                style={{ accentColor: 'var(--color-primary, #e11d48)' }}
              />
              <span>Remember Session</span>
            </label>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm shadow-xl transition-all disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: 'var(--button-primary-bg, #e11d48)',
              color: 'var(--button-primary-text, #ffffff)',
              borderRadius: 'var(--button-radius, 12px)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div
          className="mt-6 text-center text-xs"
          style={{ color: 'var(--color-text-muted, #94a3b8)' }}
        >
          Don’t have an account?{' '}
          <button
            id="login-to-signup-link"
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const redirectParam = urlParams.get('redirect');
              navigate(redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup');
            }}
            className="font-semibold hover:underline"
            style={{ color: 'var(--color-primary, #e11d48)' }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};
