/**
 * In-Memory Cache Service
 * Provides TTL-based caching for frequently accessed data.
 * Reduces database load for menu, dashboard stats, and meal lists.
 */
import NodeCache from 'node-cache';

// Default TTL: 5 minutes, check expired keys every 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/** Well-known cache keys */
export const CacheKeys = {
    WEEKLY_MENU: 'weekly_menu',
    DASHBOARD_STATS: 'dashboard_stats',
    MEALS_LIST: 'meals_list',
    TOTAL_STUDENTS: 'total_students',
} as const;

/** Cache TTLs in seconds */
export const CacheTTL = {
    WEEKLY_MENU: 600,       // 10 minutes — menu rarely changes
    DASHBOARD_STATS: 30,    // 30 seconds — near real-time but avoid hammering DB
    MEALS_LIST: 300,        // 5 minutes
    TOTAL_STUDENTS: 120,    // 2 minutes
} as const;

/**
 * Get a cached value by key.
 * Returns undefined if key doesn't exist or has expired.
 */
export function getCached<T>(key: string): T | undefined {
    return cache.get<T>(key);
}

/**
 * Set a value in cache with an optional TTL override.
 * @param key   Cache key
 * @param value Value to cache
 * @param ttl   TTL in seconds (defaults to cache-wide stdTTL)
 */
export function setCache<T>(key: string, value: T, ttl?: number): void {
    if (ttl !== undefined) {
        cache.set(key, value, ttl);
    } else {
        cache.set(key, value);
    }
}

/**
 * Invalidate (delete) one or more cache keys.
 * Call this after mutations that affect cached data.
 */
export function invalidateCache(...keys: string[]): void {
    keys.forEach((key) => cache.del(key));
}

/**
 * Flush the entire cache.
 */
export function flushCache(): void {
    cache.flushAll();
}

/**
 * Get cache statistics for monitoring.
 */
export function getCacheStats() {
    return cache.getStats();
}
