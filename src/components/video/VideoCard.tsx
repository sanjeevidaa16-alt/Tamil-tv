import React, { useState, useEffect } from 'react';
import { Play, Eye, Clock, Tv, Sparkles, Heart, Share2, Radio, Check, Calendar } from 'lucide-react';
import { Video } from '../../types';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';
import { mediaStorage } from '../../utils/mediaStorage';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useAuth } from '../../contexts/AuthContext';

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
  // Optional override for preview canvas inside admin
  previewVariant?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, previewVariant }) => {
  const { activeDesign } = useUserPanelDesign();
  const { trackClick } = useAnalytics();
  const { user, isAdmin, isManager } = useAuth();
  const cardConfig = activeDesign.card;
  const variant = previewVariant || cardConfig.variant;

  const [thumbSrc, setThumbSrc] = useState(
    video.thumbnail_url ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop'
  );
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    let active = true;
    if (
      video.thumbnail_url &&
      (video.thumbnail_url.startsWith('idb:') ||
        (!video.thumbnail_url.startsWith('http') && !video.thumbnail_url.startsWith('data:')))
    ) {
      mediaStorage.getMediaUrl(video.thumbnail_url).then((resolved) => {
        if (active && resolved) {
          setThumbSrc(resolved);
        }
      });
    } else {
      setThumbSrc(
        video.thumbnail_url ||
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop'
      );
    }
    return () => {
      active = false;
    };
  }, [video.thumbnail_url]);

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    if (variant === 'cinema-dark') return 'aspect-[21/9] sm:aspect-[21/9]';
    if (variant === 'social-video') return 'aspect-[3/4] sm:aspect-[4/5]';
    return 'aspect-video';
  };

  const handleClick = () => {
    trackClick('video_card_click', {
      video_id: video.id,
      video_title: video.title,
      video_category: video.category?.name,
    });
    if (!user && !isAdmin && !isManager) {
      const targetUrl = `/videos/${video.id}`;
      sessionStorage.setItem('STREAMVAULT_REDIRECT_URL', targetUrl);
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    if (onClick) {
      onClick();
    } else {
      navigate(`/videos/${video.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    trackClick('favorite_click', {
      video_id: video.id,
      video_title: video.title,
      is_liked: !isLiked,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShared(true);
    trackClick('share_click', {
      video_id: video.id,
      video_title: video.title,
    });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/videos/${video.id}`);
    }
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div
      id={`video-card-${video.id}`}
      onClick={handleClick}
      className={`group relative overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border ${
        variant === 'neon-tv'
          ? 'hover:shadow-[0_0_24px_rgba(225,29,72,0.4)] hover:border-rose-500'
          : variant === 'glass-tv'
          ? 'backdrop-blur-xl hover:-translate-y-1.5'
          : variant === 'future-tv'
          ? 'hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,182,212,0.2)]'
          : 'hover:-translate-y-1'
      }`}
      style={{
        backgroundColor:
          variant === 'glass-tv'
            ? 'rgba(18, 20, 32, 0.65)'
            : 'var(--color-card-background, var(--color-surface, #11131c))',
        borderColor:
          variant === 'neon-tv'
            ? 'rgba(225, 29, 72, 0.4)'
            : variant === 'glass-tv'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'var(--color-card-border, var(--color-border, #1e2233))',
        borderRadius: cardConfig.cardRadius,
        boxShadow: cardConfig.cardShadow,
      }}
    >
      {/* 1. Thumbnail Container */}
      <div className={`relative ${getAspectRatioClass()} w-full overflow-hidden bg-slate-950`}>
        <img
          src={thumbSrc}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Futuristic HUD Corner markings for Future TV */}
        {variant === 'future-tv' && (
          <>
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />
          </>
        )}

        {/* Play Button Overlay depending on design variant */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {cardConfig.playButtonVariant === 'centered-glow' && (
            <div
              className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
              style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
            >
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            </div>
          )}

          {cardConfig.playButtonVariant === 'neon-disc' && (
            <div className="w-12 h-12 rounded-full bg-slate-950/90 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.8)] transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 ml-0.5 fill-rose-500" />
            </div>
          )}

          {cardConfig.playButtonVariant === 'glass-lens' && (
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 text-white flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            </div>
          )}

          {cardConfig.playButtonVariant === 'pill-button' && (
            <div className="px-4 py-1.5 rounded-md bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>காண்க (Watch)</span>
            </div>
          )}

          {cardConfig.playButtonVariant === 'minimal-play' && (
            <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 ml-0.5 fill-black" />
            </div>
          )}

          {cardConfig.playButtonVariant === 'corner-circle' && (
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 ml-0.5 fill-white" />
            </div>
          )}
        </div>

        {/* Duration Badge */}
        {cardConfig.showDurationBadge && video.duration > 0 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono font-medium text-white flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-slate-300" />
            <span>{formatDuration(video.duration)}</span>
          </div>
        )}

        {/* Category Pill */}
        {cardConfig.showCategoryBadge && video.category?.name && (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[11px] font-semibold border backdrop-blur-md"
            style={{
              borderRadius: activeDesign.components.tagRadius,
              backgroundColor: 'rgba(17, 19, 28, 0.85)',
              color: 'var(--color-primary, #e11d48)',
              borderColor: 'var(--color-border, #1e2233)',
            }}
          >
            {video.category.name}
          </div>
        )}

        {/* Broadcast Time / Serial Badge (Tamil TV Classic & Channel Hub) */}
        {(variant === 'classic-tv' || variant === 'channel-hub') && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
            <Tv className="w-3 h-3" />
            <span>தினமும் 8:00 PM</span>
          </div>
        )}

        {/* Newspaper TV Breaking / Video Tag */}
        {variant === 'newspaper-tv' && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider">
            வீடியோ செய்தி
          </div>
        )}

        {/* Featured Badge */}
        {video.is_featured && variant !== 'newspaper-tv' && (
          <div
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase shadow-md"
            style={{
              backgroundColor: 'var(--color-warning, #f59e0b)',
              color: '#000000',
            }}
          >
            Featured
          </div>
        )}

        {/* Quick Social Actions for Social Video & Mobile First */}
        {cardConfig.showActionButtons && (
          <div className="absolute right-2 top-10 flex flex-col gap-1.5 z-10">
            <button
              onClick={handleLike}
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110 ${
                isLiked ? 'bg-rose-600 text-white' : 'bg-black/60 text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110"
            >
              {isShared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 2. Content Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Episode indicator for TV Classic & Channel Hub */}
          {(variant === 'classic-tv' || variant === 'channel-hub') && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 mb-1">
              <span>எபிசோட் #{((video.views_count || 1) % 250) + 1}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">சன் & விஜய் டிவி</span>
            </div>
          )}

          {/* Newspaper TV Editorial Byline */}
          {variant === 'newspaper-tv' && (
            <div className="text-[10px] text-slate-400 font-mono mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-500" />
              <span>{formatTimeAgo(video.created_at)}</span>
            </div>
          )}

          <h3
            className={`font-semibold text-sm sm:text-base line-clamp-2 transition-colors leading-snug ${
              variant === 'newspaper-tv' ? 'font-serif font-bold text-slate-100' : ''
            }`}
            style={{ color: 'var(--color-text, #ffffff)' }}
          >
            {video.title}
          </h3>

          {video.description && (
            <p
              className="text-xs line-clamp-2 mt-1 leading-relaxed opacity-80"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
            >
              {video.description}
            </p>
          )}
        </div>

        {/* Meta Info (Views, Date, Uploader) */}
        <div
          className="flex items-center justify-between pt-2.5 mt-2 border-t text-xs font-medium"
          style={{
            borderColor: 'var(--color-border, rgba(255, 255, 255, 0.08))',
            color: 'var(--color-text-muted, #94a3b8)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 opacity-60" />
            <span>{formatViews(video.views_count)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{formatTimeAgo(video.created_at)}</span>
            {video.uploader?.full_name && (
              <>
                <span className="opacity-40">•</span>
                <span className="truncate max-w-[85px] opacity-90" title={video.uploader.full_name}>
                  {video.uploader.full_name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
