import React from 'react';
import { Film, Lock, X, UserPlus, LogIn } from 'lucide-react';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
  videoTitle?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  navigate,
  videoTitle,
}) => {
  if (!isOpen) return null;

  const handleAuthRedirect = (path: string) => {
    sessionStorage.setItem('STREAMVAULT_REDIRECT_URL', window.location.pathname + window.location.search);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md border p-8 shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--color-surface, #11131d)',
          borderColor: 'var(--color-border, #1e2233)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 items-center justify-center shadow-lg text-rose-500 mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">Sign in to Watch</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {videoTitle ? `"${videoTitle}"` : 'Please sign in or create an account to watch this episode.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleAuthRedirect('/signup')}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
          >
            <UserPlus className="w-4 h-4" />
            <span>SIGN UP</span>
          </button>

          <button
            onClick={() => handleAuthRedirect('/login')}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4 text-rose-400" />
            <span>LOGIN</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
