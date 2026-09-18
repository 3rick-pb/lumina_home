/**
 * High-Concurrency In-Memory Cache with Stampede Protection (Promise Deduplication)
 * 
 * Solves the critical production failure mode where 50-100 simultaneous users hit the database at once:
 * 1. Stampede Protection: Concurrent requests for the same key share a single in-flight Promise.
 * 2. In-Memory Sub-Millisecond Reads: Avoids Postgres round-trips for high-traffic read paths (catalog, settings).
 * 3. TTL & SWR (Stale-While-Revalidate): Returns fresh/stale data instantly with background revalidation.
 * 4. Tag / Prefix Invalidation: Instant purge on mutations (e.g. product created, updated, or deleted).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlightPromises = new Map<string, Promise<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Retrieves an item from cache, or executes the fetcher function with stampede protection.
   * If 50 requests arrive at the exact same millisecond, only ONE executes the fetcher.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 30,
    staleExtraSeconds = 60
  ): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    // 1. Fresh hit: Return immediately from memory (0.1ms)
    if (entry && now < entry.expiresAt) {
      return entry.data;
    }

    // 2. Stale-While-Revalidate: Return stale immediately and trigger background refresh
    if (entry && now < entry.staleUntil) {
      this.revalidateInBackground(key, fetcher, ttlSeconds, staleExtraSeconds);
      return entry.data;
    }

    // 3. Stampede Protection: If another request is already fetching this key, await its promise
    const pendingPromise = this.inFlightPromises.get(key) as Promise<T> | undefined;
    if (pendingPromise) {
      return pendingPromise;
    }

    // 4. Execute fetcher and register in-flight promise
    const fetchPromise = (async () => {
      try {
        const freshData = await fetcher();
        const freshNow = Date.now();
        this.store.set(key, {
          data: freshData,
          expiresAt: freshNow + ttlSeconds * 1000,
          staleUntil: freshNow + (ttlSeconds + staleExtraSeconds) * 1000,
        });
        return freshData;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, fetchPromise as Promise<unknown>);
    return fetchPromise;
  }

  /**
   * Revalidates a cache key in background without blocking the caller.
   */
  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleExtraSeconds: number
  ) {
    if (this.inFlightPromises.has(key)) return;

    const promise = (async () => {
      try {
        const freshData = await fetcher();
        const now = Date.now();
        this.store.set(key, {
          data: freshData,
          expiresAt: now + ttlSeconds * 1000,
          staleUntil: now + (ttlSeconds + staleExtraSeconds) * 1000,
        });
      } catch (err) {
        console.warn(`[MemoryCache] Background revalidation failed for ${key}:`, err);
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
  }

  /**
   * Invalidates a specific key or all keys starting with prefix.
   */
  invalidate(keyOrPrefix: string) {
    for (const key of this.store.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Flushes all stored items.
   */
  clear() {
    this.store.clear();
    this.inFlightPromises.clear();
  }

  /**
   * Periodic garbage collection of completely expired entries.
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.staleUntil) {
        this.store.delete(key);
      }
    }
  }
}

// Global Singleton Memory Cache
const globalForCache = globalThis as unknown as { __lumina_cache?: MemoryCache };
export const appCache = globalForCache.__lumina_cache || (globalForCache.__lumina_cache = new MemoryCache());
