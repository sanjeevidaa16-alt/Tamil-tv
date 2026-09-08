import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  PictureInPicture2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
import { mediaStorage } from '../../utils/mediaStorage';

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  title?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  onEnded,
  onTimeUpdate,
  autoPlay = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic media URL resolution (handles IndexedDB local cached videos & thumbnails)
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [resolvedPoster, setResolvedPoster] = useState(poster || '');

  useEffect(() => {
    let active = true;
    setHasError(false);
    if (src && (src.startsWith('idb:') || !src.startsWith('http'))) {
      mediaStorage.getMediaUrl(src).then((url) => {
        if (active) setResolvedSrc(url);
      });
    } else {
      setResolvedSrc(src);
    }
    return () => {
      active = false;
    };
  }, [src]);

  useEffect(() => {
    let active = true;
    if (poster && (poster.startsWith('idb:') || (!poster.startsWith('http') && !poster.startsWith('data:')))) {
      mediaStorage.getMediaUrl(poster).then((url) => {
        if (active) setResolvedPoster(url);
      });
    } else {
      setResolvedPoster(poster || '');
    }
    return () => {
      active = false;
    };
  }, [poster]);

  // Initialize playback state & video properties
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict rule: Do NOT autoplay with sound!
    video.volume = volume;
    video.muted = isMuted;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setHasError(false);
    };
    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setHasError(true);
    };
    const handleVideoEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleVideoEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleVideoEnded);
    };
  }, [resolvedSrc, onEnded, onTimeUpdate]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekDelta(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          seekDelta(5);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, Number((v + 0.1).toFixed(2))));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, Number((v - 0.1).toFixed(2))));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  // Hide controls after inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.warn);
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const seekDelta = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressContainerRef.current;
    if (!video || !bar) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = ratio * duration;
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressContainerRef.current;
    if (!bar || duration === 0) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(ratio * duration);
    setHoverPosition(clickX);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(console.warn);
    } else {
      document.exitFullscreen?.().catch(console.warn);
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      id="cinema-video-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none flex items-center justify-center border border-slate-800/80"
    >
      {/* Video Element (Strictly NO autoplay with sound) */}
      <video
        ref={videoRef}
        id="html5-video-element"
        src={resolvedSrc}
        poster={resolvedPoster || undefined}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Error Fallback Overlay: Video unavailable */}
      {hasError ? (
        <div
          id="video-unavailable-overlay"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Video unavailable</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              This video stream could not be loaded or is temporarily offline. Please check your network or try again later.
            </p>
          </div>
          <button
            onClick={() => {
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Playback</span>
          </button>
        </div>
      ) : (
        <>
          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
              <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
            </div>
          )}

          {/* Large Center Play/Pause button overlay on initial or pause */}
          {!isPlaying && !isBuffering && (
            <button
              id="center-play-button"
              onClick={togglePlay}
              className="absolute z-20 w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-rose-600/90 text-white shadow-2xl shadow-rose-600/50 backdrop-blur-sm hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Play video"
            >
              <Play className="w-8 h-8 sm:w-9 sm:h-9 ml-1 fill-white" />
            </button>
          )}
        </>
      )}

      {/* Title Overlay on top when controls visible */}
      <div
        className={`absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1 drop-shadow-md">
          {title}
        </h2>
      </div>

      {/* Control Bar Overlay */}
      <div
        id="video-controls-overlay"
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Progress Bar */}
        <div
          ref={progressContainerRef}
          id="video-timeline-progress"
          onClick={handleSeek}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
          className="relative w-full h-2 group/progress cursor-pointer flex items-center py-2 mb-3"
        >
          {/* Background Track */}
          <div className="w-full h-1.5 bg-slate-700/80 rounded-full group-hover/progress:h-2 transition-all">
            {/* Played Bar */}
            <div
              className="h-full bg-rose-600 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Scrubber thumb handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
            </div>
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-white pointer-events-none -translate-x-1/2 shadow-md"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatDuration(hoverTime)}
            </div>
          )}
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              id="player-play-pause-btn"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              id="player-rewind-5s"
              onClick={() => seekDelta(-5)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
              title="Rewind 5s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="player-forward-5s"
              onClick={() => seekDelta(5)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
              title="Forward 5s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                id="player-mute-btn"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-slate-700 accent-rose-500 rounded-lg cursor-pointer"
                aria-label="Volume level"
              />
            </div>

            {/* Current Time / Duration */}
            <span className="text-xs font-mono text-slate-300 ml-1">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-3 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                id="player-speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded text-xs font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-slate-700"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div
                  id="player-speed-menu"
                  className="absolute bottom-full right-0 mb-2 py-1.5 bg-[#141620] border border-slate-700 rounded-xl shadow-xl z-40 text-xs w-24"
                >
                  <p className="px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Speed</p>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-between ${
                        playbackRate === rate ? 'text-rose-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && (
              <button
                id="player-pip-btn"
                onClick={togglePictureInPicture}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
                title="Picture-in-Picture"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
