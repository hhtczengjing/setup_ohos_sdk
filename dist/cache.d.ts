import { Platform } from './utils';
/**
 * Generate cache key
 */
export declare function getCacheKey(version: string, platform: Platform): string;
/**
 * Try to restore SDK from cache
 */
export declare function restoreSdkFromCache(version: string, platform: Platform, cachePath: string): Promise<boolean>;
/**
 * Save SDK to cache
 */
export declare function saveSdkToCache(version: string, platform: Platform, cachePath: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map