import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole: 'admin' | 'manager';
  currentRole: string;
  navigate: (path: string) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  currentRole,
  navigate,
}) => {
  return (
    <div id="access-denied-view" className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#11131d] border border-rose-900/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-600/40 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-rose-300 font-medium leading-relaxed">
            {requiredRole === 'admin'
              ? 'Access denied. Administrator privileges are required.'
              : 'Access denied. Manager privileges are required.'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current account does not have permission to view or manage this area.
          </p>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-left text-xs space-y-1 font-mono">
          <div className="text-slate-400 flex justify-between">
            <span>Your Session Role:</span>
            <span className="text-white font-bold uppercase">{currentRole || 'Guest'}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Required Tier:</span>
            <span className="text-rose-400 font-bold uppercase">{requiredRole}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>RLS Enforcement:</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            id="denied-return-home-btn"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Videos</span>
          </button>

          <button
            id="denied-switch-login-btn"
            onClick={() => navigate(requiredRole === 'admin' ? '/admin' : '/manager')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in as {requiredRole === 'admin' ? 'Admin' : 'Manager'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
