// ==============================================================================
// StreamVault: Persistent Media Cache (IndexedDB)
// Enables persistent video and thumbnail playback even when remote cloud storage
// buckets are initializing or in local fallback mode.
// ==============================================================================

const DB_NAME = 'streamvault_media_store';
const STORE_NAME = 'media_files';
const DB_VERSION = 1;

// In-memory URL cache for active blob URLs
const objectUrlMap = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const mediaStorage = {
  /**
   * Save a video or thumbnail Blob/File into IndexedDB
   * Returns a reference key formatted as "idb:<key>"
   */
  async saveMediaBlob(key: string, file: Blob | File): Promise<string> {
    const memoryUrl = URL.createObjectURL(file);
    objectUrlMap.set(key, memoryUrl);

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
          key,
          blob: file,
          type: file.type,
          size: file.size,
          updatedAt: Date.now(),
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      return `idb:${key}`;
    } catch (err) {
      console.warn('IndexedDB write warning, falling back to memory URL:', err);
      return memoryUrl;
    }
  },

  /**
   * Retrieve a Blob by key from IndexedDB
   */
  async getMediaBlob(key: string): Promise<Blob | null> {
    try {
      const cleanKey = key.replace(/^idb:/, '');
      const db = await openDatabase();

      return new Promise<Blob | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(cleanKey);

        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB read error:', err);
      return null;
    }
  },

  /**
   * Resolve an idb:<key> reference or object URL to a playable URL
   */
  async getMediaUrl(key: string, fallbackUrl: string = ''): Promise<string> {
    if (!key) return fallbackUrl;

    // If it's a standard HTTP URL, return directly
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

    const cleanKey = key.replace(/^idb:/, '');

    // Check memory cache first
    if (objectUrlMap.has(cleanKey)) {
      return objectUrlMap.get(cleanKey)!;
    }

    // Try reading from IndexedDB
    try {
      const blob = await this.getMediaBlob(cleanKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrlMap.set(cleanKey, url);
        return url;
      }
    } catch (err) {
      console.warn('Failed to resolve media URL from IndexedDB:', err);
    }

    return fallbackUrl || key;
  },

  /**
   * Delete a stored media file
   */
  async deleteMedia(key: string): Promise<void> {
    const cleanKey = key.replace(/^idb:/, '');
    if (objectUrlMap.has(cleanKey)) {
      URL.revokeObjectURL(objectUrlMap.get(cleanKey)!);
      objectUrlMap.delete(cleanKey);
    }

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete(cleanKey);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Error deleting media from IndexedDB:', err);
    }
  },

  /**
   * Save a JSON record into IndexedDB (not bound by localStorage 5MB quota)
   */
  async saveJsonRecord(key: string, data: any): Promise<void> {
    try {
      const cleanKey = key.replace(/^idb:/, '');
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const record = {
          key: cleanKey,
          data,
          updatedAt: Date.now(),
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveJsonRecord warning:', err);
    }
  },

  /**
   * Retrieve a JSON record from IndexedDB
   */
  async getJsonRecord<T>(key: string): Promise<T | null> {
    try {
      const cleanKey = key.replace(/^idb:/, '');
      const db = await openDatabase();
      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(cleanKey);
        req.onsuccess = () => {
          if (req.result && req.result.data !== undefined) {
            resolve(req.result.data as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB getJsonRecord warning:', err);
      return null;
    }
  },
};
