import React, { useEffect, useState } from 'react';
import {
  Video as VideoIcon,
  Eye,
  Plus,
  TrendingUp,
  Clock,
  Briefcase,
  Upload,
} from 'lucide-react';
import { Video } from '../../types';
import { videoService } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';
import { formatViews, formatTimeAgo, formatDuration } from '../../utils/formatters';

interface ManagerDashboardProps {
  navigateSection: (section: string) => void;
  navigate: (path: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  navigateSection,
  navigate,
}) => {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const all = await videoService.getAllVideos();
        if (!mounted) return;
        // In real setup, filter by uploaderId if manager only sees own, or all videos if content manager
        const managerVideos = all.filter(
          (v) => (v.uploader_id || v.uploaded_by) === user?.id || !v.uploaded_by
        );
        setVideos(managerVideos.length > 0 ? managerVideos : all.slice(0, 4));
      } catch (err) {
        console.error('Error loading manager dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const totalViews = videos.reduce((sum, v) => sum + v.views_count, 0);

  return (
    <div id="manager-dashboard-view" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span>Manager Content Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, {profile?.full_name || 'Manager'}. You have authorized video publishing and curation rights.
          </p>
        </div>

        <button
          id="manager-upload-video-btn"
          onClick={() => navigateSection('upload')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Master Video</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Your Content Catalog</span>
            <VideoIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{videos.length} Videos</p>
          <span className="text-[11px] text-indigo-300 font-medium mt-1 block">
            Published on StreamVault
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Cumulative Views</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{formatViews(totalViews)}</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            Aggregated stream audience
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Role Permissions</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white mt-3">Manager Tier</p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Upload • Edit • Catalog Manage
          </span>
        </div>
      </div>

      {/* Videos List */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>Managed Video Assets</span>
          </h3>
          <button
            onClick={() => navigateSection('videos')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Manage All →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => navigate(`/videos/${vid.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="w-20 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=120&fit=crop'}
                    alt={vid.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 truncate">
                    {vid.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{vid.category?.name || 'General'}</span>
                    <span>•</span>
                    <span>{formatViews(vid.views_count)} views</span>
                    <span>•</span>
                    <span className="font-mono">{formatDuration(vid.duration)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">{formatTimeAgo(vid.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
