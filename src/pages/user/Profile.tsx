import React, { useState } from 'react';
import { User, Shield, Briefcase, Mail, Calendar, Check, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { useToast } from '../../components/common/Toast';

interface ProfileProps {
  navigate: (path: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ navigate }) => {
  const { user, profile, role, refreshProfile, signOut } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await userService.updateOwnProfile(user.id, {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
      });
      await refreshProfile();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out', 'info');
    navigate('/');
  };

  return (
    <div id="user-profile-page" className="max-w-3xl mx-auto py-6 space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details and view your account authorization tier
        </p>
      </div>

      <div className="bg-[#11131c] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-8">
        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
          <div className="relative">
            <img
              src={
                avatarUrl ||
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  fullName || profile?.full_name || 'User'
                )}`
              }
              alt="Avatar"
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-slate-700 shadow-xl"
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white">{profile?.full_name || 'StreamVault Member'}</h2>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              {profile?.email}
            </p>

            {/* Role Badge */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  role === 'admin'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : role === 'manager'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {role === 'admin' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-rose-400" /> Super Admin
                  </>
                ) : role === 'manager' ? (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Manager
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Standard User
                  </>
                )}
              </span>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Details Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Assigned System Role
            </label>
            <input
              type="text"
              disabled
              value={role.toUpperCase()}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono font-bold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Roles are managed centrally by the Super Admin in accordance with platform security policies. Regular users cannot promote their account.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              id="save-profile-btn"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
