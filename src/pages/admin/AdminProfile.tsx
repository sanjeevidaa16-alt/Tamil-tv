import React, { useState } from 'react';
import { Shield, Key, User, Mail, Save, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../components/common/Toast';
import { formatTimeAgo } from '../../utils/formatters';

export const AdminProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      if (isSupabaseConfigured && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            avatar_url: avatarUrl.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      }
      await refreshProfile();
      showToast('Admin profile information updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      }

      showToast('Administrator password updated successfully in Supabase Auth', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div id="admin-profile-view" className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Shield className="w-7 h-7 text-rose-500" />
          <span>Administrator Profile & Credentials</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your verified Super Admin identity, avatar, and Supabase Auth credentials
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
        <div className="relative">
          <img
            src={
              avatarUrl ||
              profile?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                profile?.full_name || 'Admin'
              )}`
            }
            alt={profile?.full_name || 'Admin Avatar'}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-rose-500/50"
          />
          <div className="absolute -bottom-1.5 -right-1.5 bg-rose-600 rounded-lg p-1 text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-bold text-white">{profile?.full_name || 'Super Administrator'}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
              {profile?.role || 'admin'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{user?.email || profile?.email || 'sanjeevidaa@gmail.com'}</p>
          <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined: {formatTimeAgo(profile?.created_at || new Date().toISOString())}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full System Authorization</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Edit Details Form */}
        <form onSubmit={handleUpdateProfile} className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            <span>Profile Details</span>
          </h3>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Administrator Name
            </label>
            <input
              id="admin-profile-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Avatar Image URL
            </label>
            <input
              id="admin-profile-avatar"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Email (Read-Only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || profile?.email || 'sanjeevidaa@gmail.com'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <button
              id="save-admin-profile-btn"
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <Save className="w-4 h-4" />
              <span>{updatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* 2. Change Password Form via Supabase Auth */}
        <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Update Password</span>
          </h3>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              id="admin-new-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="admin-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Password updates are securely dispatched directly to the Supabase Auth identity engine with Argon2/bcrypt salting.
          </p>

          <div className="pt-2">
            <button
              id="change-admin-password-btn"
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
            >
              <Lock className="w-4 h-4" />
              <span>{updatingPassword ? 'Updating...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
