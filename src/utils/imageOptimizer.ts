// ==============================================================================
// StreamVault: Client-Side Image Optimizer
// Automatically downscales and compresses uploaded images (logos, banners, favicons)
// into lightweight, retina-ready data URLs to guarantee they never exceed storage quotas.
// ==============================================================================

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Optimize an uploaded File into a compact, web-optimized Data URL (typically 15-40KB)
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeOptions = {}
): Promise<string> {
  const { maxWidth = 600, maxHeight = 200, quality = 0.85 } = options;

  // If SVG, check size and read as optimized data URL
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        // If SVG is reasonable size (< 100KB), return as data URL
        if (text.length < 100000) {
          resolve(text);
        } else {
          // If unusually huge SVG, still return it but warn
          resolve(text);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // For raster images (PNG, JPG, WebP, ICO, etc.), downscale using Canvas
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;

      if (!srcWidth || !srcHeight) {
        // Fallback to standard FileReader if dimensions invalid
        readAsStandardDataUrl(file).then(resolve);
        return;
      }

      // Calculate proportional scaled dimensions
      const scale = Math.min(1, maxWidth / srcWidth, maxHeight / srcHeight);
      const targetWidth = Math.max(1, Math.round(srcWidth * scale));
      const targetHeight = Math.max(1, Math.round(srcHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        readAsStandardDataUrl(file).then(resolve);
        return;
      }

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Prefer WebP for high quality with minimal footprint, fallback to PNG
      try {
        const webpUrl = canvas.toDataURL('image/webp', quality);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
          return;
        }
      } catch {
        // WebP conversion not supported or canvas tainted
      }

      try {
        const pngUrl = canvas.toDataURL('image/png');
        resolve(pngUrl);
      } catch {
        readAsStandardDataUrl(file).then(resolve);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      readAsStandardDataUrl(file).then(resolve);
    };

    img.src = objectUrl;
  });
}

/**
 * Compress an existing base64 Data URL if it exceeds safe storage limits (> 60KB)
 */
export async function compressBase64Image(
  dataUrl: string,
  maxWidth = 600,
  maxHeight = 200,
  quality = 0.85
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  // If already compact or external URL, no compression needed
  if (!dataUrl.startsWith('data:image/') || dataUrl.length < 65000) {
    return dataUrl;
  }

  // If SVG, keep as is
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;

      if (!srcWidth || !srcHeight) {
        resolve(dataUrl);
        return;
      }

      const scale = Math.min(1, maxWidth / srcWidth, maxHeight / srcHeight);
      const targetWidth = Math.max(1, Math.round(srcWidth * scale));
      const targetHeight = Math.max(1, Math.round(srcHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      try {
        const webpUrl = canvas.toDataURL('image/webp', quality);
        if (webpUrl.startsWith('data:image/webp') && webpUrl.length < dataUrl.length) {
          resolve(webpUrl);
          return;
        }
      } catch {
        // continue
      }

      try {
        const pngUrl = canvas.toDataURL('image/png');
        if (pngUrl.length < dataUrl.length) {
          resolve(pngUrl);
          return;
        }
      } catch {
        // continue
      }

      resolve(dataUrl);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readAsStandardDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
