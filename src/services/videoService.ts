import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Video, UploadVideoPayload, EditVideoPayload, UserRole } from '../types';
import { SEED_VIDEOS, SEED_CATEGORIES } from '../data/seedVideos';
import { mediaStorage } from '../utils/mediaStorage';

const LOCAL_STORAGE_VIDEOS_KEY = 'STREAMVAULT_LOCAL_VIDEOS';

function getLocalVideos(): Video[] {
  const data = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(SEED_VIDEOS));
    return SEED_VIDEOS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_VIDEOS;
  }
}

function saveLocalVideos(videos: Video[]) {
  localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(videos));
}

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Ensures that a required Supabase Storage bucket exists.
 * If missing, attempts to create it as a public bucket via the Storage API.
 */
export async function ensureStorageBucket(
  bucketName: 'videos' | 'thumbnails',
  isPublic = true
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data: bucket, error: getErr } = await supabase.storage.getBucket(bucketName);
    if (!getErr && bucket) {
      return true;
    }

    // Attempt to create bucket via client
    const { error: createErr } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: bucketName === 'videos' ? 524288000 : 10485760,
    });

    if (!createErr) {
      console.log(`Successfully provisioned storage bucket '${bucketName}'`);
      return true;
    }

    console.warn(`Could not auto-create bucket '${bucketName}' via API:`, createErr.message);
    return false;
  } catch (err) {
    console.warn(`Error ensuring bucket '${bucketName}':`, err);
    return false;
  }
}

/**
 * Diagnostics helper to check whether storage buckets exist in the Supabase project
 */
export async function checkStorageBucketsStatus(): Promise<{
  configured: boolean;
  videosBucketExists: boolean;
  thumbnailsBucketExists: boolean;
  message?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      videosBucketExists: false,
      thumbnailsBucketExists: false,
      message: 'Running in local mode (Supabase credentials not configured)',
    };
  }

  let videosOk = false;
  let thumbsOk = false;

  try {
    const { data: vBucket, error: vErr } = await supabase.storage.getBucket('videos');
    videosOk = !vErr && !!vBucket;
  } catch {
    videosOk = false;
  }

  try {
    const { data: tBucket, error: tErr } = await supabase.storage.getBucket('thumbnails');
    thumbsOk = !tErr && !!tBucket;
  } catch {
    thumbsOk = false;
  }

  return {
    configured: true,
    videosBucketExists: videosOk,
    thumbnailsBucketExists: thumbsOk,
    message:
      videosOk && thumbsOk
        ? 'All cloud storage buckets (videos & thumbnails) are online and verified.'
        : 'Storage bucket(s) missing in Supabase. You can create them via the SQL Editor or run the automatic migration in Database Setup.',
  };
}

export const videoService = {
  /**
   * Fetch published & public videos for regular catalog users
   */
  async getPublishedVideos(params?: {
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'popular' | 'latest' | 'featured';
  }): Promise<{ videos: Video[]; count: number }> {
    if (!isSupabaseConfigured) {
      let list = [...getLocalVideos()].filter((v) => v.status === 'published' && (v.visibility === 'public' || !v.visibility));

      if (params?.categoryId) {
        list = list.filter((v) => v.category_id === params.categoryId);
      }

      if (params?.search) {
        const query = params.search.toLowerCase().trim();
        list = list.filter(
          (v) =>
            v.title.toLowerCase().includes(query) ||
            (v.description && v.description.toLowerCase().includes(query)) ||
            (v.category?.name && v.category.name.toLowerCase().includes(query))
        );
      }

      if (params?.sortBy === 'popular') {
        list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      } else if (params?.sortBy === 'featured') {
        list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      } else {
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      const total = list.length;
      if (params?.offset !== undefined && params?.limit !== undefined) {
        list = list.slice(params.offset, params.offset + params.limit);
      } else if (params?.limit) {
        list = list.slice(0, params.limit);
      }

      return { videos: list, count: total };
    }

    try {
      let query = supabase
        .from('videos')
        .select('*, category:categories(*), uploader:profiles(*)', { count: 'exact' })
        .eq('status', 'published');

      // Filter by public visibility
      query = query.or('visibility.eq.public,visibility.is.null');

      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }

      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      if (params?.sortBy === 'popular') {
        query = query.order('views_count', { ascending: false });
      } else if (params?.sortBy === 'featured') {
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (params?.limit) {
        const from = params.offset || 0;
        const to = from + params.limit - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;
      if (error) {
        // If table doesn't exist in schema cache, fallback to local and log warning
        console.warn('Supabase videos query note:', error.message);
        if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
          const fallback = getLocalVideos().filter((v) => v.status === 'published');
          return { videos: fallback, count: fallback.length };
        }
        throw error;
      }

      return { videos: (data || []) as Video[], count: count || 0 };
    } catch (err: any) {
      console.warn('Fallback to local catalog on error:', err.message || err);
      const fallback = getLocalVideos().filter((v) => v.status === 'published');
      return { videos: fallback, count: fallback.length };
    }
  },

  /**
   * Fetch single video by UUID or ID
   */
  async getVideoById(id: string): Promise<Video | null> {
    if (!isSupabaseConfigured) {
      const videos = getLocalVideos();
      return videos.find((v) => v.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*, category:categories(*), uploader:profiles(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
          const videos = getLocalVideos();
          return videos.find((v) => v.id === id) || null;
        }
        throw error;
      }
      return data as Video;
    } catch {
      const videos = getLocalVideos();
      return videos.find((v) => v.id === id) || null;
    }
  },

  /**
   * Fetch all videos for management (Admin sees all; Manager sees published + own uploads)
   */
  async getAllVideos(userRole: UserRole = 'admin', currentUserId?: string): Promise<Video[]> {
    if (!isSupabaseConfigured) {
      const videos = getLocalVideos();
      if (userRole === 'admin') {
        return videos;
      }
      if (userRole === 'manager') {
        return videos.filter((v) => v.status === 'published' || v.uploaded_by === currentUserId || v.uploader_id === currentUserId);
      }
      return videos.filter((v) => v.status === 'published' && v.visibility === 'public');
    }

    try {
      let query = supabase
        .from('videos')
        .select('*, category:categories(*), uploader:profiles(*)')
        .order('created_at', { ascending: false });

      if (userRole === 'manager' && currentUserId && isValidUuid(currentUserId)) {
        query = query.or(`status.eq.published,uploaded_by.eq.${currentUserId},uploader_id.eq.${currentUserId}`);
      }

      const { data, error } = await query;
      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
          console.warn('public.videos table not detected in schema cache. Providing local inventory fallback.');
          return getLocalVideos();
        }
        throw error;
      }
      return (data || []) as Video[];
    } catch (err: any) {
      if (err.message?.includes('schema cache') || err.message?.includes('does not exist')) {
        return getLocalVideos();
      }
      throw err;
    }
  },

  /**
   * Uploads video to Supabase Storage and inserts metadata into public.videos.
   * Transactionally safe: If database insert fails, storage files are rolled back (cleaned up).
   */
  async uploadVideo(
    payload: UploadVideoPayload,
    currentUserId?: string,
    onProgress?: (percent: number) => void
  ): Promise<Video> {
    const activeUserId = currentUserId || payload.uploaderId || 'admin-user';
    const progressCallback = onProgress || payload.onProgress;

    // STEP 1 & 2: Validate video format and size
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/m4v'];
    const validExtensions = ['.mp4', '.webm', '.mov', '.mkv', '.m4v'];
    const fileExt = '.' + payload.videoFile.name.split('.').pop()?.toLowerCase();
    
    const isValidType =
      validVideoTypes.includes(payload.videoFile.type) ||
      validExtensions.includes(fileExt);

    if (!isValidType) {
      throw new Error('Invalid video format. Allowed formats: MP4, WebM, MOV, MKV.');
    }

    // 500MB size limit
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (payload.videoFile.size > MAX_FILE_SIZE) {
      throw new Error('Video file size exceeds 500MB maximum limit.');
    }

    // Local mode handling when Supabase is not connected
    if (!isSupabaseConfigured) {
      progressCallback?.(20);
      const localMediaKey = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const videoUri = await mediaStorage.saveMediaBlob(localMediaKey, payload.videoFile);

      progressCallback?.(55);
      let thumbUri = payload.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&h=720&fit=crop';
      if (payload.thumbnailFile) {
        const thumbKey = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        thumbUri = await mediaStorage.saveMediaBlob(thumbKey, payload.thumbnailFile);
      }

      progressCallback?.(85);
      const localVideos = getLocalVideos();
      const categoryId = payload.category_id || payload.categoryId;
      const category = SEED_CATEGORIES.find((c) => c.id === categoryId);

      const newVid: Video = {
        id: 'vid-' + Date.now(),
        title: payload.title.trim(),
        description: payload.description || '',
        thumbnail_url: thumbUri,
        video_path: videoUri,
        duration: payload.duration || 180,
        category_id: categoryId || null,
        uploaded_by: activeUserId,
        status: payload.status || 'published',
        visibility: payload.visibility || 'public',
        is_featured: !!payload.is_featured || !!payload.isFeatured,
        views_count: 0,
        tags: payload.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: category || null,
      };

      const updated = [newVid, ...localVideos];
      saveLocalVideos(updated);
      progressCallback?.(100);
      return newVid;
    }

    // SUPABASE STORAGE & DATABASE UPLOAD PIPELINE
    let videoStoragePath = '';
    let thumbStoragePath = '';
    let publicVideoUrl = '';
    let publicThumbnailUrl = payload.thumbnailUrl || '';

    try {
      progressCallback?.(10);

      // Ensure storage buckets exist in Supabase
      await ensureStorageBucket('videos', true);
      if (payload.thumbnailFile) {
        await ensureStorageBucket('thumbnails', true);
      }

      progressCallback?.(25);

      // STEP 4: Upload Video to Supabase Storage
      const userFolder = isValidUuid(activeUserId) ? activeUserId : 'general';
      const cleanFileName = payload.videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      videoStoragePath = `${userFolder}/${uniqueSuffix}_${cleanFileName}`;

      let { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoStoragePath, payload.videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      // If bucket not found, retry after ensuring bucket
      if (videoUploadError && videoUploadError.message?.toLowerCase().includes('bucket not found')) {
        await ensureStorageBucket('videos', true);
        const retry = await supabase.storage
          .from('videos')
          .upload(videoStoragePath, payload.videoFile, {
            cacheControl: '3600',
            upsert: false,
          });
        videoUploadData = retry.data;
        videoUploadError = retry.error;
      }

      if (videoUploadError) {
        throw new Error(`Video storage upload failed: ${videoUploadError.message}`);
      }

      // Generate public streaming URL for the video
      if (videoUploadData) {
        videoStoragePath = videoUploadData.path;
        const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(videoStoragePath);
        publicVideoUrl = publicUrlData.publicUrl;
      }

      progressCallback?.(65);

      // STEP 5: Upload Thumbnail if provided
      if (payload.thumbnailFile) {
        const cleanThumbName = payload.thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        thumbStoragePath = `${userFolder}/${uniqueSuffix}_${cleanThumbName}`;

        let { data: thumbUploadData, error: thumbUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbStoragePath, payload.thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (thumbUploadError && thumbUploadError.message?.toLowerCase().includes('bucket not found')) {
          await ensureStorageBucket('thumbnails', true);
          const retryThumb = await supabase.storage
            .from('thumbnails')
            .upload(thumbStoragePath, payload.thumbnailFile, {
              cacheControl: '3600',
              upsert: false,
            });
          thumbUploadData = retryThumb.data;
          thumbUploadError = retryThumb.error;
        }

        if (thumbUploadError) {
          console.warn('Thumbnail storage upload warning:', thumbUploadError.message);
        } else if (thumbUploadData) {
          thumbStoragePath = thumbUploadData.path;
          const { data: publicThumbData } = supabase.storage.from('thumbnails').getPublicUrl(thumbStoragePath);
          publicThumbnailUrl = publicThumbData.publicUrl;
        }
      }

      progressCallback?.(85);

      // STEP 6: Insert Video Metadata Record into public.videos
      const categoryId = payload.category_id || payload.categoryId || null;
      const validUploaderId = isValidUuid(activeUserId) ? activeUserId : null;

      const insertPayload = {
        title: payload.title.trim(),
        description: payload.description || '',
        video_path: publicVideoUrl,
        video_url: publicVideoUrl,
        storage_path: videoStoragePath,
        thumbnail_url: publicThumbnailUrl || null,
        thumbnail_path: thumbStoragePath || null,
        duration: payload.duration || 180,
        duration_seconds: payload.duration || 180,
        category_id: isValidUuid(categoryId) ? categoryId : null,
        uploaded_by: validUploaderId,
        uploader_id: validUploaderId,
        status: payload.status || 'published',
        visibility: payload.visibility || 'public',
        is_featured: !!payload.is_featured || !!payload.isFeatured,
        views_count: 0,
        views: 0,
        file_size: payload.videoFile.size,
        mime_type: payload.videoFile.type || 'video/mp4',
        tags: payload.tags || [],
      };

      const { data: newVideoRecord, error: insertError } = await supabase
        .from('videos')
        .insert([insertPayload])
        .select('*, category:categories(*), uploader:profiles(*)')
        .single();

      // STEP 7 & 11: Confirm database insert succeeded. If it failed, ROLLBACK storage!
      if (insertError) {
        console.error('Database insert error:', insertError);

        // Rollback / cleanup storage objects to avoid orphans
        if (videoStoragePath) {
          await supabase.storage.from('videos').remove([videoStoragePath]).catch(console.warn);
        }
        if (thumbStoragePath) {
          await supabase.storage.from('thumbnails').remove([thumbStoragePath]).catch(console.warn);
        }

        const isSchemaMissing =
          insertError.message.includes('schema cache') ||
          insertError.message.includes('does not exist') ||
          insertError.message.includes('relation');

        if (isSchemaMissing) {
          throw new Error(
            `Video upload failed: Could not find the table 'public.videos' in Supabase database. Please go to Admin Panel > Database Setup and execute the database migration script.`
          );
        }

        throw new Error(
          `Video upload failed because video metadata could not be saved to database: ${insertError.message}`
        );
      }

      progressCallback?.(100);
      return newVideoRecord as Video;
    } catch (err: any) {
      // Step 11: Rollback on any failure
      if (videoStoragePath) {
        supabase.storage.from('videos').remove([videoStoragePath]).catch(console.warn);
      }
      if (thumbStoragePath) {
        supabase.storage.from('thumbnails').remove([thumbStoragePath]).catch(console.warn);
      }
      throw err;
    }
  },

  /**
   * Updates an existing video record
   */
  async updateVideo(
    id: string,
    payload: EditVideoPayload,
    onProgress?: (percent: number) => void
  ): Promise<Video> {
    if (!isSupabaseConfigured) {
      const videos = getLocalVideos();
      const index = videos.findIndex((v) => v.id === id);
      if (index === -1) throw new Error('Video not found in local catalog');

      let thumbUrl = payload.thumbnailUrl || payload.thumbnail_url || videos[index].thumbnail_url;
      if (payload.thumbnailFile) {
        const thumbKey = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        thumbUrl = await mediaStorage.saveMediaBlob(thumbKey, payload.thumbnailFile);
      }

      let videoPath = payload.video_path || videos[index].video_path;
      if (payload.videoFile) {
        const videoKey = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        videoPath = await mediaStorage.saveMediaBlob(videoKey, payload.videoFile);
      }

      const catId = payload.category_id || payload.categoryId;
      const category = SEED_CATEGORIES.find((c) => c.id === catId);

      const updated: Video = {
        ...videos[index],
        title: (payload.title || videos[index].title).trim(),
        description: payload.description !== undefined ? payload.description : videos[index].description,
        thumbnail_url: thumbUrl,
        video_path: videoPath,
        category_id: catId || videos[index].category_id,
        is_featured: payload.is_featured !== undefined ? payload.is_featured : videos[index].is_featured,
        status: payload.status || videos[index].status,
        visibility: payload.visibility || videos[index].visibility,
        updated_at: new Date().toISOString(),
        category: category || videos[index].category,
      };

      videos[index] = updated;
      saveLocalVideos(videos);
      onProgress?.(100);
      return updated;
    }

    let finalThumbnailUrl = payload.thumbnailUrl || payload.thumbnail_url;
    let finalVideoPath = payload.video_path;

    onProgress?.(25);

    if (payload.thumbnailFile) {
      await ensureStorageBucket('thumbnails', true);
      const cleanThumbName = payload.thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const thumbFileName = `updates/${Date.now()}_${cleanThumbName}`;
      let { data: thumbData, error: thumbErr } = await supabase.storage
        .from('thumbnails')
        .upload(thumbFileName, payload.thumbnailFile, { upsert: true });

      if (!thumbErr && thumbData) {
        const { data: publicThumb } = supabase.storage.from('thumbnails').getPublicUrl(thumbData.path);
        finalThumbnailUrl = publicThumb.publicUrl;
      }
    }

    onProgress?.(60);

    if (payload.videoFile) {
      await ensureStorageBucket('videos', true);
      const cleanVideoName = payload.videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const videoFileName = `updates/${Date.now()}_${cleanVideoName}`;
      let { data: vData, error: vErr } = await supabase.storage
        .from('videos')
        .upload(videoFileName, payload.videoFile, { upsert: true });

      if (!vErr && vData) {
        const { data: publicV } = supabase.storage.from('videos').getPublicUrl(vData.path);
        finalVideoPath = publicV.publicUrl;
      }
    }

    onProgress?.(85);

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) updateFields.title = payload.title.trim();
    if (payload.description !== undefined) updateFields.description = payload.description;
    if (payload.category_id !== undefined || payload.categoryId !== undefined) {
      const catId = payload.category_id || payload.categoryId;
      updateFields.category_id = isValidUuid(catId) ? catId : null;
    }
    if (payload.is_featured !== undefined) updateFields.is_featured = payload.is_featured;
    if (payload.isFeatured !== undefined) updateFields.is_featured = payload.isFeatured;
    if (payload.status !== undefined) updateFields.status = payload.status;
    if (payload.visibility !== undefined) updateFields.visibility = payload.visibility;
    if (payload.tags !== undefined) updateFields.tags = payload.tags;

    if (finalThumbnailUrl) {
      updateFields.thumbnail_url = finalThumbnailUrl;
    }
    if (finalVideoPath) {
      updateFields.video_path = finalVideoPath;
      updateFields.video_url = finalVideoPath;
    }

    const { data, error } = await supabase
      .from('videos')
      .update(updateFields)
      .eq('id', id)
      .select('*, category:categories(*), uploader:profiles(*)')
      .single();

    if (error) throw error;
    onProgress?.(100);
    return data as Video;
  },

  /**
   * Deletes a video record completely and safely from the database and storage.
   * Transactionally handles auth verification, record lookup, database deletion, storage cleanup, and local sync.
   */
  async deleteVideo(
    id: string,
    fallbackVideoPath?: string,
    fallbackThumbnailUrl?: string | null
  ): Promise<{ success: boolean; id: string; title?: string }> {
    // 1. Handle local / non-UUID / unconfigured instances cleanly
    if (!isSupabaseConfigured || !isValidUuid(id)) {
      const videos = getLocalVideos();
      const existing = videos.find((v) => v.id === id);
      const filtered = videos.filter((v) => v.id !== id);
      saveLocalVideos(filtered);
      return { success: true, id, title: existing?.title || 'Video' };
    }

    // 2. Fetch existing video metadata from Supabase first (to obtain exact storage paths & confirm existence)
    let existingVideo: any = null;
    try {
      const { data, error: fetchErr } = await supabase
        .from('videos')
        .select('id, title, storage_path, thumbnail_path, video_path, video_url, thumbnail_url, uploaded_by, uploader_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        if (
          fetchErr.message?.includes('schema cache') ||
          fetchErr.message?.includes('does not exist') ||
          fetchErr.message?.includes('relation')
        ) {
          // If the schema is missing, clean local storage if present and provide clear guidance
          const videos = getLocalVideos();
          const hasLocal = videos.some((v) => v.id === id);
          if (hasLocal) {
            saveLocalVideos(videos.filter((v) => v.id !== id));
            return { success: true, id };
          }
          throw new Error(
            "Could not find the table 'public.videos' in Supabase database. Please go to Admin Panel > Database Setup and execute the database migration script."
          );
        }
        throw fetchErr;
      }
      existingVideo = data;
    } catch (err: any) {
      if (
        err.message?.includes('schema cache') ||
        err.message?.includes('does not exist') ||
        err.message?.includes('relation')
      ) {
        const videos = getLocalVideos();
        const hasLocal = videos.some((v) => v.id === id);
        if (hasLocal) {
          saveLocalVideos(videos.filter((v) => v.id !== id));
          return { success: true, id };
        }
        throw new Error(
          "Could not find the table 'public.videos' in Supabase database. Please go to Admin Panel > Database Setup and execute the database migration script."
        );
      }
      throw err;
    }

    // If video record was not found in database:
    if (!existingVideo) {
      const videos = getLocalVideos();
      const hasLocal = videos.some((v) => v.id === id);
      if (hasLocal) {
        saveLocalVideos(videos.filter((v) => v.id !== id));
        return { success: true, id };
      }
      throw new Error('Video not found.');
    }

    // 3. Perform database deletion
    // Strategy A: Call secure RPC delete_video
    let rpcSucceeded = false;
    let rpcResult: any = null;

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('delete_video', {
        target_video_id: id,
      });

      if (!rpcErr && rpcData) {
        rpcSucceeded = true;
        rpcResult = rpcData;
      } else if (rpcErr) {
        if (rpcErr.message?.includes('Permission denied') || rpcErr.code === '42501') {
          throw new Error(rpcErr.message || 'Permission denied. Only administrators or the video uploader can delete this video.');
        }
        if (rpcErr.message?.includes('Video not found')) {
          throw new Error('Video not found.');
        }
        console.warn('RPC delete_video error, falling back to direct table delete:', rpcErr.message);
      }
    } catch (err: any) {
      if (err.message?.includes('Permission denied') || err.message?.includes('Video not found')) {
        throw err;
      }
      console.warn('RPC delete_video notice, attempting direct table delete:', err.message);
    }

    // Strategy B: If RPC not yet installed or fallback needed, perform direct delete
    if (!rpcSucceeded) {
      // First clean up dependent views
      try {
        await supabase.from('video_views').delete().eq('video_id', id);
      } catch (viewErr) {
        console.warn('Non-blocking video_views deletion notice:', viewErr);
      }

      // Delete exactly this video from public.videos
      const { error: delErr } = await supabase.from('videos').delete().eq('id', id);
      if (delErr) {
        if (
          delErr.message?.includes('schema cache') ||
          delErr.message?.includes('does not exist') ||
          delErr.message?.includes('relation')
        ) {
          throw new Error(
            "Could not find the table 'public.videos' in Supabase database. Please go to Admin Panel > Database Setup and execute the database migration script."
          );
        }
        if (delErr.code === '42501' || delErr.message?.includes('permission') || delErr.message?.includes('policy')) {
          throw new Error('Permission denied. Only administrators or the video uploader can delete this video.');
        }
        throw new Error(`Failed to delete video from database: ${delErr.message}`);
      }
    }

    // 4. Storage cleanup: Video file & Thumbnail
    // Collect video storage paths
    const videoStoragePaths: string[] = [];
    const directVideoStoragePath = rpcResult?.storage_path || existingVideo.storage_path;
    if (directVideoStoragePath) {
      videoStoragePaths.push(directVideoStoragePath);
    }

    const vUrl = rpcResult?.video_path || rpcResult?.video_url || existingVideo.video_path || existingVideo.video_url || fallbackVideoPath;
    if (vUrl && typeof vUrl === 'string' && vUrl.includes('/storage/v1/object/public/videos/')) {
      const parts = vUrl.split('/storage/v1/object/public/videos/');
      if (parts[1]) {
        const decoded = decodeURIComponent(parts[1].split('?')[0]);
        if (decoded && !videoStoragePaths.includes(decoded)) {
          videoStoragePaths.push(decoded);
        }
      }
    }

    // Collect thumbnail storage paths
    const thumbStoragePaths: string[] = [];
    const directThumbStoragePath = rpcResult?.thumbnail_path || existingVideo.thumbnail_path;
    if (directThumbStoragePath) {
      thumbStoragePaths.push(directThumbStoragePath);
    }

    const tUrl = rpcResult?.thumbnail_url || existingVideo.thumbnail_url || fallbackThumbnailUrl;
    if (tUrl && typeof tUrl === 'string' && tUrl.includes('/storage/v1/object/public/thumbnails/')) {
      const parts = tUrl.split('/storage/v1/object/public/thumbnails/');
      if (parts[1]) {
        const decoded = decodeURIComponent(parts[1].split('?')[0]);
        if (decoded && !thumbStoragePaths.includes(decoded)) {
          thumbStoragePaths.push(decoded);
        }
      }
    }

    // Clean up Supabase storage files safely
    if (videoStoragePaths.length > 0) {
      try {
        await supabase.storage.from('videos').remove(videoStoragePaths);
      } catch (stErr) {
        console.warn('Storage video cleanup note:', stErr);
      }
    }

    if (thumbStoragePaths.length > 0) {
      try {
        await supabase.storage.from('thumbnails').remove(thumbStoragePaths);
      } catch (stErr) {
        console.warn('Storage thumbnail cleanup note:', stErr);
      }
    }

    // 5. Synchronize local storage state
    try {
      const localVids = getLocalVideos();
      saveLocalVideos(localVids.filter((v) => v.id !== id));
    } catch (localErr) {
      console.warn('Local state sync warning:', localErr);
    }

    return {
      success: true,
      id,
      title: rpcResult?.title || existingVideo.title || 'Video',
    };
  },

  /**
   * Records video view
   */
  async recordView(videoId: string, userId?: string | null): Promise<void> {
    const sessionKey = `STREAMVAULT_VIEW_${videoId}`;
    const lastViewTime = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    if (lastViewTime && now - parseInt(lastViewTime, 10) < 600000) {
      return;
    }

    sessionStorage.setItem(sessionKey, now.toString());

    if (!isSupabaseConfigured) {
      const videos = getLocalVideos();
      const video = videos.find((v) => v.id === videoId);
      if (video) {
        video.views_count = (video.views_count || 0) + 1;
        saveLocalVideos(videos);
      }
      return;
    }

    try {
      if (isValidUuid(videoId)) {
        await supabase.from('video_views').insert([
          {
            video_id: videoId,
            user_id: isValidUuid(userId) ? userId : null,
          },
        ]);

        const { data: vData } = await supabase.from('videos').select('views_count').eq('id', videoId).single();
        if (vData) {
          await supabase
            .from('videos')
            .update({ views_count: (vData.views_count || 0) + 1, views: (vData.views_count || 0) + 1 })
            .eq('id', videoId);
        }
      }
    } catch (err) {
      console.warn('View record non-blocking note:', err);
    }
  },
};
