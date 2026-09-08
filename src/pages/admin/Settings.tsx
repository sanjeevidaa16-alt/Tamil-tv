import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  HardDrive,
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
} from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_URL } from '../../lib/supabase';
import { SupabaseConfigModal } from '../../components/common/SupabaseConfigModal';
import { useToast } from '../../components/common/Toast';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySchemaNotice = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    showToast('Path copied: supabase/schema.sql', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="admin-settings-view" className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-rose-500" />
          <span>System & Security Infrastructure</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supabase connectivity, Row-Level Security verification, and cloud storage bucket status
        </p>
      </div>

      {/* 1. SUPABASE CONNECTION STATUS */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isSupabaseConfigured ? 'Supabase Project Active' : 'Local Demo Store Mode'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isSupabaseConfigured ? SUPABASE_URL : 'No remote credentials configured yet'}
              </p>
            </div>
          </div>

          <button
            id="open-config-btn"
            onClick={() => setConfigModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            {isSupabaseConfigured ? 'Update Supabase Credentials' : 'Connect Real Supabase Project'}
          </button>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dual Operational Modes (Local Demo + Live Supabase):</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The platform is built to operate immediately out of the box with an in-memory & localStorage fallback database. When you provide your Supabase URL and anon key, it dynamically switches all Auth, RLS queries, and Storage uploads to your real Supabase instance.
          </p>
        </div>
      </div>

      {/* 2. CLOUD STORAGE BUCKETS */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          <span>Storage Bucket Specifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-rose-400">videos</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                Public Read
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Stores encoded master MP4/WebM files. Write access is restricted via storage RLS policies to authenticated users with role = <b className="text-slate-200">admin</b> or <b className="text-slate-200">manager</b>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-amber-400">thumbnails</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                Public Read
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Stores video poster graphics and previews. Write access is restricted to Super Admin and Managers only.
            </p>
          </div>
        </div>
      </div>

      {/* 3. ROW-LEVEL SECURITY AUDIT */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Row-Level Security (RLS) Policy Engine</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Table / Entity</th>
                <th className="pb-3 px-3">Public / Viewer</th>
                <th className="pb-3 px-3">Manager</th>
                <th className="pb-3 px-3">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-white">videos</td>
                <td className="py-3 px-3 text-emerald-400">Read (published)</td>
                <td className="py-3 px-3 text-sky-400">Read / Insert / Update (own)</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Full Access (All)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-white">categories</td>
                <td className="py-3 px-3 text-emerald-400">Read all</td>
                <td className="py-3 px-3 text-slate-500">Read only</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Full Access (Manage)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-white">profiles</td>
                <td className="py-3 px-3 text-emerald-400">Read public fields</td>
                <td className="py-3 px-3 text-emerald-400">Read public fields</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Full Access (Manage roles)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-white">storage.objects</td>
                <td className="py-3 px-3 text-emerald-400">Download media</td>
                <td className="py-3 px-3 text-sky-400">Upload media</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Full Access (Purge)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            Full SQL migration available in supabase/schema.sql
          </span>
          <button
            onClick={handleCopySchemaNotice}
            className="text-rose-400 hover:text-rose-300 font-semibold"
          >
            {copied ? 'Copied Path!' : 'Copy Path'}
          </button>
        </div>
      </div>

      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  );
};
