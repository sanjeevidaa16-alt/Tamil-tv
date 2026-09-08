import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, Film, Loader2, Sparkles, Tag, Layers } from 'lucide-react';
import { Video, Category, VideoFilter } from '../../types';
import { videoService } from '../../services/videoService';
import { categoryService } from '../../services/categoryService';
import { filterService } from '../../services/filterService';
import { VideoCard } from '../../components/video/VideoCard';
import { AdPlacementSlot } from '../../components/ads/AdPlacementSlot';
import { AdsterraSlot } from '../../components/ads/AdsterraSlot';
import { useAdSense } from '../../contexts/AdSenseContext';
import { useAdsterra } from '../../contexts/AdsterraContext';

interface VideosProps {
  navigate: (path: string) => void;
  initialSearch?: string;
  initialCategory?: string;
}

export const Videos: React.FC<VideosProps> = ({
  navigate,
  initialSearch = '',
  initialCategory = '',
}) => {
  const { getPlacement } = useAdSense();
  const { getPlacement: getAdsterraPlacement, isAdsterraActive } = useAdsterra();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<VideoFilter[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFilterValues, setSelectedFilterValues] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'featured'>('latest');
  const [loading, setLoading] = useState(true);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load dynamic filters & categories from database
  useEffect(() => {
    Promise.all([
      filterService.getFilters(false),
      categoryService.getCategories(),
    ])
      .then(([activeFilters, activeCategories]) => {
        setFilters(activeFilters);
        setCategories(activeCategories);
      })
      .catch(console.error);
  }, []);

  // Fetch published videos from database
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    videoService
      .getPublishedVideos({
        search: debouncedSearch,
        categoryId: selectedCategory || undefined,
        sortBy,
      })
      .then((res) => {
        if (!mounted) return;
        setVideos(res.videos);
      })
      .catch((err) => {
        console.error('Error fetching videos:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearch, selectedCategory, sortBy]);

  // Handle dynamic filter option toggle
  const handleSelectFilterOption = (filterSlug: string, optionValue: string) => {
    setSelectedFilterValues((prev) => {
      const next = { ...prev };
      if (next[filterSlug] === optionValue || !optionValue) {
        delete next[filterSlug];
      } else {
        next[filterSlug] = optionValue;
      }
      return next;
    });
  };

  // Client-side filtering for dynamic custom filters (e.g. Language, Quality, Era, Mood)
  const filteredVideos = useMemo(() => {
    const activeEntries = Object.entries(selectedFilterValues).filter(([_, val]) => Boolean(val));
    if (activeEntries.length === 0) return videos;

    return videos.filter((vid) => {
      return activeEntries.every(([slug, targetValue]) => {
        const lowerTarget = String(targetValue).toLowerCase();

        // 1. If slug is 'category', match against video category
        if (slug === 'category') {
          const catName = vid.category?.name?.toLowerCase() || '';
          const catSlug = vid.category?.slug?.toLowerCase() || '';
          return catName.includes(lowerTarget) || catSlug.includes(lowerTarget);
        }

        // 2. Check video tags
        const tags = (vid.tags || []).map((t) => t.toLowerCase());
        if (tags.some((t) => t.includes(lowerTarget) || lowerTarget.includes(t))) {
          return true;
        }

        // 3. Check title / description
        const title = vid.title.toLowerCase();
        const desc = (vid.description || '').toLowerCase();
        return title.includes(lowerTarget) || desc.includes(lowerTarget);
      });
    });
  }, [videos, selectedFilterValues]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedFilterValues({});
    setSortBy('latest');
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    selectedCategory ||
    Object.keys(selectedFilterValues).length > 0
  );

  const inFeedPlacement = getPlacement('video_list_in_feed');
  const inFeedFrequency = inFeedPlacement?.frequency || 5;

  const adsterraInFeed = getAdsterraPlacement('between_video_cards');
  const adsterraInFeedFrequency = adsterraInFeed?.frequency || 5;

  return (
    <div id="videos-catalog-page" className="space-y-6 pb-16">
      {/* Adsterra: Videos Page Top */}
      <AdsterraSlot placementKey="videos_top" />

      {/* 1. Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-rose-500" />
            <span>Videos</span>
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            id="catalog-search-input"
            type="text"
            placeholder="Search by title, tags, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Google AdSense: Video List Top Placement */}
      <AdPlacementSlot placementKey="video_list_top" />

      {/* 3. Dynamic Filter Groups from Database */}
      {filters.length > 0 && (
        <div className="space-y-2.5 p-4 bg-[#10121b] border border-slate-800/80 rounded-3xl text-xs">
          {filters.map((filter) => {
            const enabledOptions = (filter.options || []).filter((o) => o.enabled);
            if (enabledOptions.length === 0) return null;

            const selectedVal = selectedFilterValues[filter.slug] || '';

            return (
              <div
                key={filter.id}
                id={`filter-row-${filter.slug}`}
                className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none"
              >
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] shrink-0 mr-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-500" />
                  {filter.name}:
                </span>

                {/* 'All' option */}
                <button
                  onClick={() => handleSelectFilterOption(filter.slug, '')}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    !selectedVal
                      ? 'bg-rose-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All
                </button>

                {/* Configured dynamic options */}
                {enabledOptions.map((opt) => {
                  const isSelected = selectedVal === opt.value;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectFilterOption(filter.slug, opt.value)}
                      className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-rose-600 border-rose-500 text-white shadow-sm font-semibold'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Video Grid with In-Feed Ad Placements */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-video bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <b className="text-white">{filteredVideos.length}</b>{' '}
              {filteredVideos.length === 1 ? 'video' : 'videos'}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Adsterra: Videos Page Center */}
          <AdsterraSlot placementKey="videos_center" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => {
              const shouldShowInFeedAd =
                inFeedPlacement?.enabled &&
                (index + 1) % inFeedFrequency === 0 &&
                index < filteredVideos.length - 1;

              const shouldShowAdsterraInFeed =
                isAdsterraActive &&
                adsterraInFeed?.enabled &&
                (index + 1) % adsterraInFeedFrequency === 0 &&
                index < filteredVideos.length - 1;

              return (
                <React.Fragment key={video.id}>
                  <VideoCard
                    video={video}
                    onClick={() => navigate(`/videos/${video.id}`)}
                  />

                  {/* Google AdSense In-Feed */}
                  {shouldShowInFeedAd && (
                    <div className="col-span-full my-2">
                      <AdPlacementSlot placementKey="video_list_in_feed" />
                    </div>
                  )}

                  {/* Adsterra In-Feed Placement (Between Video Cards) */}
                  {shouldShowAdsterraInFeed && (
                    <div className="col-span-full my-2">
                      <AdsterraSlot placementKey="between_video_cards" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-[#11131c] border border-slate-800 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {hasActiveFilters ? 'No videos found.' : 'No videos available yet.'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'No videos match your active search and filter criteria. Try resetting your filter selection.'
              : 'There are currently no published videos in the library.'}
          </p>
          {hasActiveFilters && (
            <button
              id="clear-filters-btn"
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* 5. Google AdSense: Video List Bottom Placement */}
      <AdPlacementSlot placementKey="video_list_bottom" />

      {/* Adsterra: Videos Page Bottom Placement */}
      <AdsterraSlot placementKey="videos_bottom" />
    </div>
  );
};
