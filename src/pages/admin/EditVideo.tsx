import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Lock,
  Globe,
  Tag,
  Clock,
} from 'lucide-react';
import { Video, Category, VideoStatus, VideoVisibility } from '../../types';
import { videoService } from '../../services/videoService';
import { categoryService } from '../../services/categoryService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';
import { formatDuration } from '../../utils/formatters';

interface EditVideoProps {
  videoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditVideo: React.FC<EditVideoProps> = ({ videoId, onSuccess, onCancel }) => {
  const { showToast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<VideoStatus>('published');
  const [visibility, setVisibility] = useState<VideoVisibility>('public');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [cats, vid] = await Promise.all([
          categoryService.getCategories(),
          videoService.getVideoById(videoId),
        ]);

        if (!mounted) return;
        setCategories(cats);

        if (vid) {
          setVideo(vid);
          setTitle(vid.title);
          setDescription(vid.description || '');
          setCategoryId(vid.category_id || '');
          setThumbnailUrl(vid.thumbnail_url || '');
          setStatus(vid.status);
          setVisibility((vid.visibility as any) || 'public');
          setTagsInput(vid.tags ? vid.tags.join(', ') : '');
          setIsFeatured(vid.is_featured);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load video details', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title cannot be empty', 'error');
      return;
    }

    setSaving(true);
    const parsedTags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    try {
      await videoService.updateVideo(videoId, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        status,
        visibility,
        tags: parsedTags,
        is_featured: isFeatured,
      });

      showToast('Video details updated successfully', 'success');
      await settingsService.logAdminAction(
        'Updated video metadata & visibility',
        'video',
        videoId,
        title.trim()
      );
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to update video', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-12">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-40 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-400">Video not found.</p>
        <button
          onClick={onCancel}
          className="mt-3 px-4 py-2 rounded-xl bg-slate-800 text-xs text-white"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div id="edit-video-view" className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel and return</span>
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">Edit Video Metadata</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-[#11131c] border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Video Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Unassigned</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="preview">Preview</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Video Duration (Calculated Automatically)</span>
          </label>
          <div className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono flex items-center justify-between">
            <span className="font-bold text-white">{formatDuration(video?.duration || 0)}</span>
            <span className="text-slate-500">{video?.duration || 0} seconds</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-rose-400" />
            <span>Tags (Comma Separated)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 4k, music, premiere"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Synopsis / Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Poster Thumbnail URL
          </label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
          />
          {thumbnailUrl && (
            <div className="mt-2 w-48 aspect-video rounded-xl overflow-hidden border border-slate-700">
              <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <input
            id="edit-featured-checkbox"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="edit-featured-checkbox" className="text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pin as Featured Hero Title</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

