import React, { useState } from 'react';
import { Briefcase, Lock, Mail, ArrowRight, Loader2, Film, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';

interface ManagerLoginProps {
  navigate: (path: string) => void;
}

export const ManagerLogin: React.FC<ManagerLoginProps> = ({ navigate }) => {
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      showToast('Please provide both manager email and password', 'error');
      return;
    }

    setLoading(true);
    const { error, role } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      const msg = error.message || 'Invalid manager credentials. Please check and try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } else if (role !== 'manager') {
      const msg = 'Access denied. Manager privileges are required.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } else {
      showToast('Manager session verified successfully', 'success');
      navigate('/manager/dashboard');
    }
  };

  return (
    <div id="manager-login-page" className="min-h-screen bg-[#07080e] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#11131d] border border-indigo-900/40 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 items-center justify-center shadow-lg shadow-indigo-950/60 mb-4 ring-2 ring-indigo-500/30">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">StreamVault Manager</h1>
          <p className="text-xs text-indigo-300/80 mt-1 uppercase font-semibold tracking-wider">
            Manager Login
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Authorized content managers only
          </p>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                id="manager-email"
                type="email"
                required
                placeholder="manager@streamvault.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="manager-forgot-password-link"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password
                </button>
                <button
                  type="button"
                  id="toggle-manager-password-visibility"
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
                id="manager-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            id="manager-signin-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Manager Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            <span>Return to StreamVault Videos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
