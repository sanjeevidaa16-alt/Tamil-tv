import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Film,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Video } from '../../types';
import { videoService } from '../../services/videoService';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { VideoCard } from '../../components/video/VideoCard';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { AdPlacementSlot } from '../../components/ads/AdPlacementSlot';
import { AdsterraSlot } from '../../components/ads/AdsterraSlot';

interface VideoDetailsProps {
  id: string;
  navigate: (path: string) => void;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({ id, navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadVideoData() {
      try {
        const found = await videoService.getVideoById(id);
        if (!mounted) return;

        if (!found) {
          setVideo(null);
          setLoading(false);
          return;
        }

        setVideo(found);

        // Record video view safely (handles duplicate prevention internally)
        videoService.recordView(found.id, user?.id);

        // Fetch related videos in same category or general published
        const relatedRes = await videoService.getPublishedVideos({
          categoryId: found.category_id || undefined,
          limit: 6,
        });

        if (mounted) {
          // Filter out current video
          setRelatedVideos(relatedRes.videos.filter((v) => v.id !== id).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching video details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadVideoData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Video link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="w-32 h-6 bg-slate-800/80 rounded animate-pulse" />
        <div className="aspect-video w-full bg-slate-900 rounded-3xl animate-pulse" />
        <div className="h-8 w-2/3 bg-slate-800 rounded animate-pulse" />
        <div className="h-20 w-full bg-slate-900/60 rounded animate-pulse" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-2xl font-bold text-white">Video not found</h2>
        <p className="text-xs text-slate-400">
          The video requested may be private, removed, or the link is invalid.
        </p>
        <button
          onClick={() => navigate('/videos')}
          className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div id="video-details-page" className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-videos-btn"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Videos</span>
        </button>

        <button
          id="share-video-btn"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copied' : 'Share Video'}</span>
        </button>
      </div>

      {/* Ad: Above Video Player */}
      <AdPlacementSlot placementKey="video_details_above_player" />

      {/* Adsterra: Video Before Player */}
      <AdsterraSlot placementKey="video_before_player" />

      {/* Primary Video Player Stage (Strictly NO autoplay with sound) */}
      <section id="main-player-stage">
        <VideoPlayer
          src={video.video_path}
          poster={video.thumbnail_url}
          title={video.title}
          autoPlay={false}
        />
      </section>

      {/* Ad: Below Video Player */}
      <AdPlacementSlot placementKey="video_details_below_player" />

      {/* Adsterra: Video After Player */}
      <AdsterraSlot placementKey="video_after_player" />

      {/* Video Details & Meta Section */}
      <section className="bg-[#11131c] border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {video.category?.name && (
              <span
                onClick={() => video.category?.slug && navigate(`/categories/${video.category.slug}`)}
                className="px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer hover:bg-rose-600/30 transition-colors"
              >
                {video.category.name}
              </span>
            )}
            {video.is_featured && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Featured Title
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatDuration(video.duration)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {video.title}
          </h1>

          {/* Stats & Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-4 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Eye className="w-4 h-4 text-slate-400" />
                {formatViews(video.views_count)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Published {formatTimeAgo(video.created_at)}
              </span>
            </div>

            {/* Uploader / Producer info */}
            {video.uploader && (
              <div className="flex items-center gap-2">
                <img
                  src={
                    video.uploader.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      video.uploader.full_name || 'Uploader'
                    )}`
                  }
                  alt={video.uploader.full_name || 'Uploader'}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
                />
                <span className="text-slate-300 font-medium">{video.uploader.full_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                  {video.uploader.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Synopsis / Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {video.description || 'No detailed synopsis provided for this cinematic title.'}
          </p>
        </div>

        {/* Ad: Below Description */}
        <AdPlacementSlot placementKey="video_details_below_description" />

        {/* Adsterra: Video Below Description */}
        <AdsterraSlot placementKey="video_below_description" />

        {/* Stream Security Disclaimer */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            StreamVault High-Definition playback encrypted. Uploads and modifications reserved exclusively for authorized platform studio personnel.
          </span>
        </div>
      </section>

      {/* Adsterra: Video Before Related */}
      <AdsterraSlot placementKey="video_before_related" />

      {/* Related Titles Section */}
      {relatedVideos.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" /> More Like This
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedVideos.map((rVideo) => (
              <VideoCard
                key={rVideo.id}
                video={rVideo}
                onClick={() => navigate(`/videos/${rVideo.id}`)}
              />
            ))}
          </div>

          {/* Adsterra: Video After Related */}
          <AdsterraSlot placementKey="video_after_related" />
        </section>
      )}
    </div>
  );
};
