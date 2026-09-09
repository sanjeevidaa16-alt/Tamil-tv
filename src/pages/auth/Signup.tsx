import React, { useState } from 'react';
import { Film, Lock, Mail, User as UserIcon, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface SignupProps {
  navigate: (path: string) => void;
}

export const Signup: React.FC<SignupProps> = ({ navigate }) => {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const { trackAuth } = useAnalytics();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const sanitizeRedirect = (url: string | null): string => {
    if (!url) return '/';
    if (url.startsWith('/') && !url.startsWith('//') && !url.toLowerCase().includes('javascript:')) {
      return url;
    }
    return '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('All fields are required', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    const { error } = await signUp(fullName.trim(), email.trim(), password);
    setLoading(false);

    if (error) {
      showToast(error.message || 'Signup failed', 'error');
    } else {
      trackAuth('sign_up', 'email_password');
      setIsSuccess(true);
      showToast('Account created successfully!', 'success');
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const queryRedirect = urlParams.get('redirect');
        const storedRedirect = sessionStorage.getItem('STREAMVAULT_REDIRECT_URL');
        const rawRedirect = queryRedirect || storedRedirect;
        sessionStorage.removeItem('STREAMVAULT_REDIRECT_URL');
        const safeRedirect = sanitizeRedirect(rawRedirect);
        navigate(safeRedirect || '/');
      }, 1500);
    }
  };

  return (
    <div id="signup-page" className="min-h-[80vh] flex items-center justify-center px-3.5 sm:px-4 py-8 sm:py-12">
      <div
        className="w-full max-w-md border p-5 sm:p-8 shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--color-surface, #11131d)',
          borderColor: 'var(--color-border, #1e2233)',
          borderRadius: 'var(--card-radius, 24px)',
          boxShadow: 'var(--card-shadow, 0 20px 40px -15px rgba(0,0,0,0.6))',
        }}
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex w-12 h-12 rounded-2xl items-center justify-center shadow-lg mb-3 text-white"
            style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
          >
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--color-text, #ffffff)' }}
          >
            Create StreamVault Account
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-muted, #94a3b8)' }}
          >
            Standard user accounts can stream, browse, and search all published content.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--color-text, #ffffff)' }}
            >
              Registration Complete
            </h3>
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
            >
              Taking you to your streaming dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted, #94a3b8)' }}
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-background, #181a26)',
                    borderColor: 'var(--color-input-border, #2a2f42)',
                    borderRadius: 'var(--input-radius, 12px)',
                    color: 'var(--color-text, #ffffff)',
                  }}
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted, #94a3b8)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="signup-email"
                  type="email"
                  required
                  placeholder="jane@example.com"
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
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted, #94a3b8)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
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

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted, #94a3b8)' }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
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

            <p
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
            >
              * Notice: Uploading videos is strictly restricted to Super Admins and authorized Managers. Standard members enjoy streaming and viewing privileges.
            </p>

            <button
              type="submit"
              id="signup-submit-btn"
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div
          className="mt-6 text-center text-xs"
          style={{ color: 'var(--color-text-muted, #94a3b8)' }}
        >
          Already registered?{' '}
          <button
            id="signup-to-login-link"
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const redirectParam = urlParams.get('redirect');
              navigate(redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login');
            }}
            className="font-semibold hover:underline"
            style={{ color: 'var(--color-primary, #e11d48)' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
