import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileVideo,
  Sparkles,
  Lock,
  Globe,
  Tag,
} from 'lucide-react';
import { Category, VideoStatus, VideoVisibility } from '../../types';
import { categoryService } from '../../services/categoryService';
import { videoService } from '../../services/videoService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { formatFileSize } from '../../utils/formatters';

interface UploadVideoProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const UploadVideo: React.FC<UploadVideoProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<VideoStatus>('published');
  const [visibility, setVisibility] = useState<VideoVisibility>('public');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Files
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Progress & States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag & drop highlight
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleVideoSelect = (file: File) => {
    // Validate format
    const validExtensions = ['mp4', 'webm', 'mov', 'm4v'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext) && !file.type.startsWith('video/')) {
      showToast('Invalid format. Please upload MP4, WebM, or MOV.', 'error');
      return;
    }

    // Size limit check (500MB)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('File exceeds 500MB limit', 'error');
      return;
    }

    setVideoFile(file);
    setErrorMessage(null);
    if (!title) {
      // Auto-populate clean title from filename
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }
  };

  const handleThumbSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Thumbnail must be an image (JPEG, PNG, WebP)', 'error');
      return;
    }
    setThumbnailFile(file);
    setThumbnailUrlInput('');
    const preview = URL.createObjectURL(file);
    setThumbnailPreview(preview);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('You must be signed in to upload', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('Please provide a video title', 'error');
      return;
    }

    if (!videoFile) {
      showToast('Please select a video file to upload', 'error');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(10);

    const parsedTags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    try {
      const createdVideo = await videoService.uploadVideo({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        status,
        visibility,
        tags: parsedTags,
        isFeatured,
        uploaderId: user.id,
        videoFile,
        thumbnailFile: thumbnailFile || undefined,
        thumbnailUrl: thumbnailUrlInput.trim() || undefined,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setUploadProgress(100);
      setUploadComplete(true);
      showToast('Video published successfully!', 'success');
      await settingsService.logAdminAction(
        'Uploaded new video master',
        'video',
        createdVideo?.id || 'new',
        title.trim()
      );
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Upload failure:', err);
      setErrorMessage(err.message || 'Failed to upload video');
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="upload-video-view" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Publish New Video
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Encode and distribute full HD/4K videos to the global stream network
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {uploadComplete ? (
        <div className="text-center py-16 bg-[#11131c] border border-slate-800 rounded-3xl p-8 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-white">Upload & Encoding Complete!</h2>
          <p className="text-xs text-slate-400">
            Your video is now indexed and live on StreamVault. Redirecting to video management...
          </p>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 1. VIDEO FILE DROPZONE */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Video File <span className="text-rose-500">*</span>
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingVideo(true);
              }}
              onDragLeave={() => setIsDraggingVideo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingVideo(false);
                if (e.dataTransfer.files?.[0]) {
                  handleVideoSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                videoFile
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : isDraggingVideo
                  ? 'border-rose-500 bg-rose-950/20'
                  : 'border-slate-700/80 bg-[#11131e] hover:border-slate-600 hover:bg-[#141724]'
              }`}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleVideoSelect(e.target.files[0]);
                }}
              />

              {videoFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-white">{videoFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{formatFileSize(videoFile.size)}</p>
                  <span className="text-xs text-emerald-400 font-medium">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">
                      Drag and drop your video file here, or browse
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports MP4, WebM, MOV. Maximum file size 500MB.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. TITLE & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="upload-video-title"
                type="text"
                required
                placeholder="e.g. Cyberpunk Nexus 2088"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="upload-video-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Synopsis & Description
            </label>
            <textarea
              id="upload-video-desc"
              rows={3}
              placeholder="Provide context, credits, or storyline summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* 4. TAGS INPUT */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              <span>Video Tags (Comma Separated)</span>
            </label>
            <input
              id="upload-video-tags"
              type="text"
              placeholder="e.g. sci-fi, trailer, 4k, futuristic"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* 5. THUMBNAIL (File or URL) */}
          <div className="p-5 bg-[#11131e] border border-slate-800 rounded-2xl space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Video Poster Thumbnail
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* File upload trigger */}
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border border-dashed border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-rose-500/50 bg-[#151724]"
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleThumbSelect(e.target.files[0]);
                  }}
                />
                <ImageIcon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {thumbnailFile ? thumbnailFile.name : 'Upload image file'}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP</p>
              </div>

              {/* Or direct image URL */}
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL (e.g. Unsplash)"
                  value={thumbnailUrlInput}
                  onChange={(e) => {
                    setThumbnailUrlInput(e.target.value);
                    setThumbnailFile(null);
                    setThumbnailPreview(e.target.value);
                  }}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave blank to auto-assign a cinematic stock thumbnail.
                </p>
              </div>
            </div>

            {thumbnailPreview && (
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 block mb-1">Thumbnail Preview:</span>
                <div className="relative aspect-video w-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* 6. PUBLISHING & VISIBILITY SETTINGS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-[#11131e] border border-slate-800 rounded-2xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Publication Status
              </label>
              <select
                id="upload-video-status"
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
                Visibility Scope
              </label>
              <select
                id="upload-video-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="public">Public (Everyone)</option>
                <option value="private">Private (Restricted)</option>
                <option value="preview">Preview (Trailers/Unlisted)</option>
              </select>
            </div>

            <div className="flex items-center sm:pt-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="upload-video-featured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Hero Feature
                  </span>
                  <p className="text-[10px] text-slate-400">Promote to top carousel</p>
                </div>
              </label>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-600/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-300">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {(errorMessage.includes('public.videos') || errorMessage.includes('Database Setup') || errorMessage.includes('schema cache')) && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#/admin/database-setup';
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap shrink-0 transition-colors"
                >
                  Open Database Setup
                </button>
              )}
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  Uploading and indexing media...
                </span>
                <span className="font-mono font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-video-upload-btn"
              disabled={isUploading || !videoFile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xl shadow-rose-950/50 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Publish</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

