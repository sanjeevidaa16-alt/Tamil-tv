import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  Sparkles,
  Lock,
  Globe,
  Play,
  X,
  RefreshCw,
} from 'lucide-react';
import { Video, Category, VideoStatus, VideoVisibility } from '../../types';
import { videoService } from '../../services/videoService';
import { categoryService } from '../../services/categoryService';
import { settingsService } from '../../services/settingsService';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';

interface VideosManageProps {
  onUploadClick: () => void;
  onEditClick: (videoId: string) => void;
  navigate: (path: string) => void;
}

export const VideosManage: React.FC<VideosManageProps> = ({
  onUploadClick,
  onEditClick,
  navigate,
}) => {
  const { showToast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'draft' | 'private' | 'preview'>('all');
  const [loading, setLoading] = useState(true);

  // Preview modal state
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, vids] = await Promise.all([
        categoryService.getCategories(),
        videoService.getAllVideos(),
      ]);
      setCategories(cats);
      setVideos(vids);
    } catch (err: any) {
      showToast(err.message || 'Error loading videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickStatusChange = async (video: Video, newStatus: VideoStatus, newVisibility: VideoVisibility) => {
    try {
      await videoService.updateVideo(video.id, {
        status: newStatus,
        visibility: newVisibility,
      });
      showToast(`Updated "${video.title}" to ${newStatus} (${newVisibility})`, 'success');
      await settingsService.logAdminAction(
        `Updated video status to ${newStatus} (${newVisibility})`,
        'video',
        video.id,
        video.title
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update video status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      const res = await videoService.deleteVideo(
        deleteTarget.id,
        deleteTarget.video_path,
        deleteTarget.thumbnail_url
      );
      showToast('Video deleted successfully from storage and database', 'success');
      await settingsService.logAdminAction(
        'Deleted video asset',
        'video',
        deleteTarget.id,
        deleteTarget.title || 'Untitled'
      );
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      console.error('Delete video error:', err);
      showToast(err.message || 'Failed to delete video', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase()) ||
      v.uploader?.full_name?.toLowerCase().includes(search.toLowerCase());

    const matchesCat = !selectedCategory || v.category_id === selectedCategory;

    if (!matchesSearch || !matchesCat) return false;

    if (activeFilter === 'published') return v.status === 'published';
    if (activeFilter === 'draft') return v.status === 'draft' || v.status === 'unpublished';
    if (activeFilter === 'private') return (v.visibility as any) === 'private' || v.status === 'draft';
    if (activeFilter === 'preview') return (v.visibility as any) === 'preview' || v.status === 'unlisted';

    return true;
  });

  return (
    <div id="admin-videos-manage" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <VideoIcon className="w-7 h-7 text-rose-500" />
            <span>Video Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, monitor performance, update visibility, edit metadata, or purge catalog titles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#11131c] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="add-video-top-btn"
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Video</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3 p-4 bg-[#11131c] border border-slate-800 rounded-2xl">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Videos (${videos.length})` },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'private', label: 'Private' },
            { id: 'preview', label: 'Preview / Trailers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-[#181a26] text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
          <div className="relative sm:col-span-2">
            <input
              id="video-admin-search"
              type="text"
              placeholder="Search by title, synopsis, or producer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            id="video-admin-cat-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-[#11131d] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141624] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Title & Media</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Producer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading video records from database...
                  </td>
                </tr>
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-slate-850/50 transition-colors group">
                    {/* Media Thumbnail & Title */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div
                        onClick={() => setPreviewVideo(video)}
                        className="relative w-20 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 cursor-pointer group/thumb"
                      >
                        <img
                          src={
                            video.thumbnail_url ||
                            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=120&fit=crop'
                          }
                          alt={video.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                        {video.is_featured && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-[8px] font-black text-black px-1 rounded uppercase">
                            Star
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <p
                          onClick={() => setPreviewVideo(video)}
                          className="font-bold text-white truncate text-xs group-hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          {video.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {video.description || 'No synopsis'}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-medium text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                        {video.category?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* Uploader */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-medium">
                          {video.uploader?.full_name || 'System'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {video.uploader?.role || 'Admin'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          video.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : video.status === 'draft' || video.status === 'unpublished'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            video.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {video.status}
                      </span>
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          (video.visibility as any) === 'private'
                            ? 'text-violet-400'
                            : (video.visibility as any) === 'preview'
                            ? 'text-pink-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {(video.visibility as any) === 'private' ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{video.visibility || 'public'}</span>
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {formatDuration(video.duration)}
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {formatViews(video.views_count)}
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(video.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview Player Modal */}
                        <button
                          id={`view-video-${video.id}`}
                          onClick={() => setPreviewVideo(video)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Inline Preview Player"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Toggle Status */}
                        {video.status === 'published' ? (
                          <button
                            onClick={() => handleQuickStatusChange(video, 'draft', 'private')}
                            className="p-1.5 text-slate-400 hover:text-violet-300 rounded-lg hover:bg-violet-950/40 transition-colors"
                            title="Make Private (Draft)"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickStatusChange(video, 'published', 'public')}
                            className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-950/40 transition-colors"
                            title="Publish Publicly"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          id={`edit-video-${video.id}`}
                          onClick={() => onEditClick(video.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit Video Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`delete-video-${video.id}`}
                          onClick={() => setDeleteTarget(video)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-950/40 transition-colors"
                          title="Delete Video Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No video assets found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Preview Player Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#11131d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{previewVideo.title}</h3>
                <p className="text-xs text-slate-400">
                  Status: <span className="text-rose-400 uppercase font-bold">{previewVideo.status}</span> • Visibility:{' '}
                  <span className="text-sky-400 uppercase font-bold">{previewVideo.visibility || 'public'}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-inner">
              <video
                src={previewVideo.video_path}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400 truncate max-w-md">
                {previewVideo.description || 'No description provided.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigate(`/videos/${previewVideo.id}`);
                    setPreviewVideo(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </button>
                <button
                  onClick={() => {
                    onEditClick(previewVideo.id);
                    setPreviewVideo(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Metadata</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Confirm Video Deletion"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <b className="text-white font-semibold">{deleteTarget?.title}</b>?
          </p>
          <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-300">
            This operation is permanent. It will delete the video from Supabase Storage and remove all metadata, view counts, and associations from the database.
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-video-btn"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Forever'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
