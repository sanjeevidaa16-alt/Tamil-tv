import React, { useState } from 'react';
import { Database, Key, CheckCircle, ExternalLink, RefreshCw, Terminal } from 'lucide-react';
import { Modal } from './Modal';
import { isSupabaseConfigured, supabaseUrl, updateSupabaseConfig, resetSupabaseConfig } from '../../lib/supabase';
import { useToast } from './Toast';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState('');
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      showToast('Please enter both Supabase Project URL and Public Anon Key', 'error');
      return;
    }
    updateSupabaseConfig(url, key);
    showToast('Supabase configuration saved! Reloading...', 'success');
    onClose();
  };

  const handleReset = () => {
    resetSupabaseConfig();
    showToast('Reset to demo mode', 'info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Database & Storage Settings"
      description="Connect your Supabase project to enable live PostgreSQL, Auth, and Storage."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
          isSupabaseConfigured
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
        }`}>
          <div className="mt-0.5">
            {isSupabaseConfigured ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Database className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <p className="font-semibold text-white">
              {isSupabaseConfigured ? 'Supabase Connected & Active' : 'Currently in Local Interactive Demo Mode'}
            </p>
            <p className="text-xs mt-1 text-slate-300 leading-relaxed">
              {isSupabaseConfigured
                ? `Connected to: ${supabaseUrl}. All videos, roles, and storage operations are synchronized directly to your Supabase instance.`
                : 'Interactive fallback mode is active with pre-seeded cinematic videos and mock authentication. You can connect your live Supabase project below or in .env'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Supabase Project URL (VITE_SUPABASE_URL)
            </label>
            <div className="relative">
              <input
                id="supabase-url-input"
                type="text"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#181a24] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Supabase Publishable Anon Key (VITE_SUPABASE_PUBLISHABLE_KEY)
            </label>
            <div className="relative">
              <input
                id="supabase-key-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-[#181a24] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Found in your Supabase Dashboard under <b>Project Settings → API</b>. Never paste your service_role secret here.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <Terminal className="w-4 h-4" />
              <span>Database & Storage Migration Script</span>
            </div>
            <p className="text-slate-400">
              Run the generated SQL script located at <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">supabase/schema.sql</code> in your Supabase SQL Editor to provision tables, triggers, and RLS policies.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSupabaseConfigured && (
              <button
                type="button"
                id="reset-supabase-btn"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-rose-400 underline transition-colors"
              >
                Clear Custom Credentials
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                id="save-supabase-btn"
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/30 transition-all"
              >
                <Key className="w-4 h-4" />
                Connect & Reload
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
