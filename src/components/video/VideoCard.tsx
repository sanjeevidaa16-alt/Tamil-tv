import React, { useState, useEffect } from 'react';
import { Play, Eye, Clock } from 'lucide-react';
import { Video } from '../../types';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';
import { mediaStorage } from '../../utils/mediaStorage';

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [thumbSrc, setThumbSrc] = useState(
    video.thumbnail_url ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop'
  );

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

  return (
    <div
      id={`video-card-${video.id}`}
      onClick={onClick}
      className="group relative bg-[#11131c] rounded-2xl overflow-hidden border border-slate-800/80 hover:border-rose-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20 cursor-pointer flex flex-col"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={thumbSrc}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-900/60 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono font-medium text-white flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-slate-300" />
            <span>{formatDuration(video.duration)}</span>
          </div>
        )}

        {/* Category Pill */}
        {video.category?.name && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-sm text-[11px] font-semibold text-rose-400 border border-slate-700/80">
            {video.category.name}
          </div>
        )}

        {/* Featured Badge */}
        {video.is_featured && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500/90 text-black font-bold text-[10px] tracking-wider uppercase shadow-md">
            Featured
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-rose-400 line-clamp-2 transition-colors leading-snug">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Meta Info (Views, Date, Uploader) */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/60 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatViews(video.views_count)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{formatTimeAgo(video.created_at)}</span>
            {video.uploader?.full_name && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 truncate max-w-[90px]" title={video.uploader.full_name}>
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
