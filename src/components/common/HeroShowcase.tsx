import React from 'react';
import { Play, Sparkles, Film, Radio, Calendar, Info, Clock, Volume2, Share2, Flame, Tv } from 'lucide-react';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';
import { Video } from '../../types';

interface HeroShowcaseProps {
  featuredVideo?: Video | null;
  onPlayClick?: (video: Video) => void;
  onExploreClick?: () => void;
}

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({
  featuredVideo,
  onPlayClick,
  onExploreClick,
}) => {
  const { activeDesign } = useUserPanelDesign();

  if (!activeDesign.layout.hasHeroBanner || activeDesign.layout.heroStyle === 'none') {
    return null;
  }

  // Fallback featured data if no database video is marked as featured
  const title = featuredVideo?.title || 'பொன்னியின் செல்வன்: பாகம் 2 (Ponniyin Selvan 2)';
  const description =
    featuredVideo?.description ||
    'மணிரத்னம் இயக்கத்தில், ஏ.ஆர்.ரஹ்மான் இசையில் பிரம்மாண்ட வரலாற்றுத் திரைப்படம். விக்ரம், கார்த்தி, ஜெயம் ரவி, ஐஸ்வர்யா ராய் நடித்துள்ள காவியப் படைப்பு.';
  const categoryName = featuredVideo?.category?.name || 'Blockbuster Movie';
  const duration = featuredVideo?.duration || 7200;
  const thumbnailUrl =
    featuredVideo?.thumbnail_url ||
    'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=1600&auto=format&fit=crop&q=80';

  const handlePlay = () => {
    if (featuredVideo && onPlayClick) {
      onPlayClick(featuredVideo);
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  // 1. TAMIL TV CLASSIC / TV BROADCAST HERO
  if (activeDesign.layout.heroStyle === 'tv-broadcast') {
    return (
      <div
        id="hero-tv-broadcast"
        className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-950 via-[#10121e] to-slate-950 p-4 sm:p-6 shadow-xl mb-8"
      >
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-full lg:w-3/5 aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-pointer" onClick={handlePlay}>
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-rose-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>இன்றைய சிறப்பு ஒளிபரப்பு</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span className="font-bold flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> இரவு 8:00 PM
              </span>
              <span className="bg-black/60 px-2 py-0.5 rounded font-mono">Mega Prime Time</span>
            </div>
          </div>

          <div className="w-full lg:w-2/5 space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Tv className="w-3.5 h-3.5" />
              <span>சன் & விஜய் டிவி பிரைம் டைம் தொடர்கள்</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">{title}</h2>
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{description}</p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePlay}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>இப்போதே பார்க்க (Watch Now)</span>
              </button>
              <button
                onClick={onExploreClick}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-colors"
              >
                முழு அட்டவணை (Schedule)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. NEWSPAPER EDITORIAL HERO
  if (activeDesign.layout.heroStyle === 'newspaper-headline') {
    return (
      <div id="hero-newspaper-headline" className="border-b-2 border-slate-800 pb-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>பிரதான காணொளி (Lead Video Story)</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{new Date().toLocaleDateString('ta-IN', { dateStyle: 'full' })}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white font-serif tracking-tight leading-tight hover:text-rose-400 cursor-pointer transition-colors" onClick={handlePlay}>
              {title}
            </h1>

            <div className="relative aspect-video w-full rounded overflow-hidden border border-slate-800 group cursor-pointer" onClick={handlePlay}>
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <button
                  onClick={handlePlay}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>வீடியோ பார்க்க (Play Video)</span>
                </button>
                <span className="text-[11px] text-slate-300 font-mono bg-black/70 px-2 py-1 rounded">
                  நேரலை அறிக்கை • HD
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 font-serif leading-relaxed line-clamp-2 border-l-2 border-rose-500 pl-3 italic">
              {description}
            </p>
          </div>

          <div className="lg:col-span-4 space-y-4 border-l border-slate-800/80 pl-0 lg:pl-6">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>முக்கிய செய்திகள் (Top Headlines)</span>
              <Flame className="w-3.5 h-3.5 text-rose-500" />
            </div>
            {[
              { time: '10 நிமிடங்களுக்கு முன்', text: 'புதிய தமிழ் திரைப்பட டிரெய்லர்கள் வெளியீடு!' },
              { time: '1 மணி நேரத்திற்கு முன்', text: 'சன் டிவி மற்றும் விஜய் டிவி வாராந்திர டிஆர்பி ரேட்டிங்ஸ்.' },
              { time: '2 மணி நேரத்திற்கு முன்', text: 'இளையராஜா இசை கச்சேரி சிறப்புத் தொகுப்பு காணொளி.' },
              { time: 'இன்று காலை', text: 'தமிழ்நாடு திரைப்பட தயாரிப்பாளர் சங்கத்தின் புதிய அறிவிப்பு.' },
            ].map((news, idx) => (
              <div key={idx} className="space-y-1 cursor-pointer group" onClick={onExploreClick}>
                <span className="text-[10px] text-rose-400 font-mono font-medium">{news.time}</span>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-rose-400 transition-colors line-clamp-2">
                  {news.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. SOCIAL SPOTLIGHT HERO
  if (activeDesign.layout.heroStyle === 'social-spotlight') {
    return (
      <div id="hero-social-spotlight" className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181a28] to-[#0c0d14] border border-white/10 p-4 sm:p-6 mb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
              SV
            </div>
            <div>
              <p className="text-white font-bold">Trending Tamil Creators & Channels</p>
              <p className="text-[10px] text-slate-400">1.2M Viewers Streaming Now</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30">
            🔥 HOT PICKS
          </span>
        </div>

        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full rounded-2xl overflow-hidden group cursor-pointer" onClick={handlePlay}>
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {categoryName}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-md">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/60"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. FUTURE PRISM / HOLOGRAPHIC HERO
  if (activeDesign.layout.heroStyle === 'future-prism') {
    return (
      <div id="hero-future-prism" className="relative overflow-hidden rounded-[28px] border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-[#071322] to-slate-950 p-6 sm:p-8 mb-8 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>QUANTUM TAMIL STREAM MATRIX // 4K HDR</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
              {description}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePlay}
                className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>ENGAGE STREAM</span>
              </button>
              <button
                onClick={onExploreClick}
                className="px-5 py-3 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors"
              >
                NODE_INFO()
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl cursor-pointer group" onClick={handlePlay}>
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono">
              TAMIL_AUDIO_5.1
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. STANDARD CINEMATIC BILLBOARD (TAMIL OTT, PREMIUM OTT, CINEMA DARK, GLASS TV, NEON TV)
  return (
    <div
      id="hero-cinematic-billboard"
      className="relative overflow-hidden mb-8 group rounded-3xl"
      style={{
        borderRadius: activeDesign.card.cardRadius,
        boxShadow: activeDesign.card.cardShadow,
        border: activeDesign.card.cardBorder,
      }}
    >
      {/* Background Poster with Gradient */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-slate-950">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Cinematic Multi-stop Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c]/90 via-[#07080c]/40 to-transparent" />

        {/* Active Design Badge */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
          <span
            className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5"
            style={{
              borderRadius: activeDesign.components.tagRadius,
              backgroundColor: 'rgba(7, 8, 12, 0.75)',
              borderColor: 'var(--color-primary, #e11d48)',
              color: 'var(--color-primary, #e11d48)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{categoryName}</span>
          </span>

          <span
            className="px-2.5 py-1 text-[10px] font-mono backdrop-blur-md border text-slate-300"
            style={{
              borderRadius: activeDesign.components.tagRadius,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            தமிழ் ஆடியோ • 4K UHD
          </span>
        </div>

        {/* Billboard Hero Content */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 max-w-2xl space-y-3">
          <h1
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none drop-shadow-xl"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed drop-shadow">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlay}
              className="px-6 py-3 font-bold text-xs text-white flex items-center gap-2 shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{
                borderRadius: activeDesign.components.buttonRadius,
                backgroundColor: 'var(--color-primary, #e11d48)',
              }}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>உடனே காண்க (Watch Now)</span>
            </button>

            <button
              onClick={onExploreClick}
              className="px-4 py-3 font-medium text-xs text-slate-200 hover:text-white backdrop-blur-md border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2"
              style={{
                borderRadius: activeDesign.components.buttonRadius,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <Info className="w-4 h-4" />
              <span>விவரங்கள் (More Details)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
