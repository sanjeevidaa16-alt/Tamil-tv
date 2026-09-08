import React, { useState, useEffect } from 'react';
import { ArrowLeft, Film, Compass, Loader2 } from 'lucide-react';
import { Category as CategoryType, Video } from '../../types';
import { categoryService } from '../../services/categoryService';
import { videoService } from '../../services/videoService';
import { VideoCard } from '../../components/video/VideoCard';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface CategoryPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug, navigate }) => {
  const { trackCategoryView } = useAnalytics();
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadCategory() {
      try {
        const cat = await categoryService.getCategoryBySlug(slug);
        if (!mounted) return;
        setCategory(cat);

        if (cat) {
          trackCategoryView(cat.id, cat.name);
          const res = await videoService.getPublishedVideos({ categoryId: cat.id });
          if (mounted) setVideos(res.videos);
        }
      } catch (err) {
        console.error('Error loading category page:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategory();
    return () => {
      mounted = false;
    };
  }, [slug, trackCategoryView]);

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="w-32 h-6 bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-2xl font-bold text-white">Category Not Found</h2>
        <p className="text-xs text-slate-400">The channel or category you are looking for does not exist.</p>
        <button
          onClick={() => navigate('/videos')}
          className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          View All Videos
        </button>
      </div>
    );
  }

  return (
    <div id="category-detail-page" className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Videos</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{category.name}</h1>
            <p className="text-xs text-slate-400 mt-1">{category.description || 'Curated video streams in this category'}</p>
          </div>
        </div>
      </div>

      {/* Videos in this Category */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/videos/${video.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#11131c] border border-slate-800 rounded-3xl p-8 space-y-3">
          <Film className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No titles in this category yet</h3>
          <p className="text-xs text-slate-400">Check back soon as platform managers add new premieres.</p>
        </div>
      )}
    </div>
  );
};
