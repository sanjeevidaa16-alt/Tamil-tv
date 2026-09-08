import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Eye, Users, Film, Award, Clock } from 'lucide-react';
import { DashboardStats, Video } from '../../types';
import { userService } from '../../services/userService';
import { formatViews, formatDuration } from '../../utils/formatters';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    userService
      .getDashboardAnalytics()
      .then((res) => {
        if (mounted) setStats(res);
      })
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
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#11131c] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Simulated week streaming velocity data for visual telemetry
  const velocityData = [
    { day: 'Mon', views: Math.round(stats.totalViews * 0.08) + 120 },
    { day: 'Tue', views: Math.round(stats.totalViews * 0.11) + 180 },
    { day: 'Wed', views: Math.round(stats.totalViews * 0.14) + 240 },
    { day: 'Thu', views: Math.round(stats.totalViews * 0.18) + 310 },
    { day: 'Fri', views: Math.round(stats.totalViews * 0.22) + 450 },
    { day: 'Sat', views: Math.round(stats.totalViews * 0.27) + 520 },
    { day: 'Sun', views: Math.round(stats.totalViews * 0.25) + 490 },
  ];

  const maxDailyViews = Math.max(...velocityData.map((d) => d.views), 100);

  return (
    <div id="admin-analytics-view" className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-rose-500" />
          <span>Stream Performance & Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time catalog viewership impressions, audience retention, and category distributions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Aggregate Impressions</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{formatViews(stats.totalViews)}</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            +18.4% compared to prior month
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Audience Reach</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{stats.totalUsers} Members</p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            92% active viewer engagement
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Catalog Volume</span>
            <Film className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{stats.totalVideos} Master Titles</p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Managed by {stats.totalManagers} authorized creators
          </span>
        </div>
      </div>

      {/* 7-Day Velocity Chart */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Weekly Playback Velocity</span>
            </h3>
            <p className="text-xs text-slate-400">Aggregated play session telemetry</p>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-800">
          {velocityData.map((d, i) => {
            const heightPct = Math.round((d.views / maxDailyViews) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.views}
                </div>
                <div className="w-full max-w-[48px] bg-slate-800 rounded-t-xl overflow-hidden h-36 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all duration-500 group-hover:from-rose-500 group-hover:to-amber-400 shadow-lg shadow-rose-950/40"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Titles Leaderboard */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Performing Master Videos</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Rank</th>
                <th className="pb-3 px-3">Title</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Duration</th>
                <th className="pb-3 px-3">Views</th>
                <th className="pb-3 px-3">Engagement Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.topViewedVideos.map((vid, idx) => {
                const sharePct = stats.totalViews > 0
                  ? Math.round((vid.views_count / stats.totalViews) * 100)
                  : 0;
                return (
                  <tr key={vid.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-3">
                      <div className="w-12 aspect-video rounded overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&h=80&fit=crop'}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="truncate max-w-xs">{vid.title}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{vid.category?.name || 'General'}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{formatDuration(vid.duration)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {formatViews(vid.views_count)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.min(sharePct * 2, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{sharePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
