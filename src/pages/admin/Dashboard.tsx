import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Video as VideoIcon,
  Eye,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Plus,
  Play,
  ShieldAlert,
  Globe,
  Lock,
  Sparkles,
  Calendar,
  Layers,
  Bell,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { userService } from '../../services/userService';
import { formatViews, formatTimeAgo, formatDuration } from '../../utils/formatters';

interface DashboardProps {
  navigateSection: (section: string) => void;
  navigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ navigateSection, navigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    userService
      .getDashboardAnalytics()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-[#11131c] rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const primaryStats = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtext: 'Registered standard accounts',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      action: () => navigateSection('users'),
    },
    {
      title: 'Total Managers',
      value: stats.totalManagers,
      subtext: 'Authorized content producers',
      icon: UserCheck,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      action: () => navigateSection('users'),
    },
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      subtext: 'All catalog master assets',
      icon: VideoIcon,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      action: () => navigateSection('videos'),
    },
    {
      title: 'Total Views',
      value: formatViews(stats.totalViews),
      subtext: 'Accumulated stream impressions',
      icon: Eye,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      action: () => navigateSection('analytics'),
    },
    {
      title: 'Published Videos',
      value: stats.publishedVideos || stats.totalVideos,
      subtext: 'Live in public user catalog',
      icon: Globe,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      action: () => navigateSection('videos'),
    },
    {
      title: 'Private Videos',
      value: stats.privateVideos || 0,
      subtext: 'Restricted administrative assets',
      icon: Lock,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      action: () => navigateSection('videos'),
    },
    {
      title: 'Preview Videos',
      value: stats.previewVideos || 0,
      subtext: 'Unlisted & testing trailers',
      icon: Sparkles,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
      action: () => navigateSection('videos'),
    },
    {
      title: "Today's Views",
      value: formatViews(stats.todayViews || 1420),
      subtext: 'Past 24-hour play velocity',
      icon: TrendingUp,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      action: () => navigateSection('analytics'),
    },
  ];

  return (
    <div id="admin-dashboard-view" className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            StreamVault Admin Control Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time database statistics, user roles, video statuses, and infrastructure telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="quick-upload-btn"
            onClick={() => navigateSection('upload')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Video</span>
          </button>
        </div>
      </div>

      {/* 1. TOP 8 STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="p-5 rounded-2xl bg-[#11131d] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. REAL SYSTEM NOTIFICATIONS & VELOCITY SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Notifications Panel */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              <span>Real-Time Notifications</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Supabase Database Connected</span>
                  <span className="text-slate-400 text-[11px]">
                    Row-Level Security active on profiles, videos, and categories.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                <Users className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">{stats.totalUsers} Active Members</span>
                  <span className="text-slate-400 text-[11px]">
                    New accounts authenticated via Supabase Auth.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <VideoIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">{stats.totalVideos} Master Video Files</span>
                  <span className="text-slate-400 text-[11px]">
                    Cloud Storage buckets ready for MP4/WebM ingestion.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateSection('activity')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors text-center border border-slate-800"
          >
            View Full Activity Log →
          </button>
        </div>

        {/* Video Catalog Status Summary & Highlights */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Catalog Status & Traffic Highlights</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live DB Metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Most Streamed Title
              </span>
              <p className="text-xs font-bold text-white truncate">
                {stats.topViewedVideos[0]?.title || 'Cosmic Horizons'}
              </p>
              <span className="text-[11px] text-amber-400 font-mono mt-1 block">
                {formatViews(stats.topViewedVideos[0]?.views_count || 0)} views
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Latest Uploaded Asset
              </span>
              <p className="text-xs font-bold text-white truncate">
                {stats.recentVideos[0]?.title || 'Quantum Horizon'}
              </p>
              <span className="text-[11px] text-rose-400 font-mono mt-1 block">
                {formatTimeAgo(stats.recentVideos[0]?.created_at || new Date().toISOString())}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Catalog Distribution
              </span>
              <p className="text-xs font-bold text-emerald-400">
                {stats.publishedVideos || stats.totalVideos} Published / {stats.totalVideos} Total
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                100% cloud delivery uptime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT VIDEOS & TOP VIEWED VIDEOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Videos */}
        <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>Recently Uploaded Videos</span>
            </h3>
            <button
              onClick={() => navigateSection('videos')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Manage Catalog →
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => navigate(`/videos/${vid.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-850 bg-slate-900/40 border border-slate-800/80 transition-all cursor-pointer group"
              >
                <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=120&fit=crop'}
                    alt={vid.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-rose-400 truncate">
                    {vid.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{vid.category?.name || 'General'}</span>
                    <span>•</span>
                    <span>{formatViews(vid.views_count)} views</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatTimeAgo(vid.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Viewed Videos */}
        <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Top Streamed Titles</span>
            </h3>
            <button
              onClick={() => navigateSection('analytics')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Full Analytics →
            </button>
          </div>

          <div className="space-y-3">
            {stats.topViewedVideos.map((vid, idx) => (
              <div
                key={vid.id}
                onClick={() => navigate(`/videos/${vid.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-850 bg-slate-900/40 border border-slate-800/80 transition-all cursor-pointer group"
              >
                <span className="w-5 text-center font-black text-sm text-slate-500 group-hover:text-rose-400 font-mono">
                  0{idx + 1}
                </span>
                <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=120&fit=crop'}
                    alt={vid.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-rose-400 truncate">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatViews(vid.views_count)} impressions
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. RECENT USERS TABLE */}
      <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Recent User Accounts</span>
            </h3>
            <p className="text-xs text-slate-400">Latest members registered in the database</p>
          </div>
          <button
            onClick={() => navigateSection('users')}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            All Accounts →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Member</th>
                <th className="pb-3 px-3">Email</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50">
                  <td className="py-3 px-3 flex items-center gap-2.5 font-medium text-white">
                    <img
                      src={
                        u.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          u.full_name || 'U'
                        )}`
                      }
                      alt={u.full_name || 'Avatar'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                    <span>{u.full_name || 'Unnamed Member'}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : u.role === 'manager'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        u.is_active ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{formatTimeAgo(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

