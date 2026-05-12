"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKey = getCacheKey;
exports.restoreSdkFromCache = restoreSdkFromCache;
exports.saveSdkToCache = saveSdkToCache;
const core = __importStar(require("@actions/core"));
const cache = __importStar(require("@actions/cache"));
const fs = __importStar(require("fs"));
/**
 * Generate cache key
 */
function getCacheKey(version, platform) {
    return `ohos-sdk-${version}-${platform}`;
}
/**
 * Try to restore SDK from cache
 */
async function restoreSdkFromCache(version, platform, cachePath) {
    const cacheKey = getCacheKey(version, platform);
    try {
        core.info(`Trying to restore SDK from cache (key: ${cacheKey})...`);
        // Check if path exists first
        if (!fs.existsSync(cachePath)) {
            core.info('Cache path does not exist, skipping cache restore');
            return false;
        }
        const restoredKey = await cache.restoreCache([cachePath], cacheKey);
        if (restoredKey) {
            core.info(`Cache hit! Restored from cache (key: ${restoredKey})`);
            return true;
        }
        core.info('Cache miss, will download and install');
        return false;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        core.warning(`Failed to restore from cache: ${message}. Continuing with fresh install...`);
        return false;
    }
}
/**
 * Save SDK to cache
 */
async function saveSdkToCache(version, platform, cachePath) {
    const cacheKey = getCacheKey(version, platform);
    try {
        // Check if path exists
        if (!fs.existsSync(cachePath)) {
            core.warning(`Cache path does not exist: ${cachePath}`);
            return;
        }
        core.info(`Saving SDK to cache (key: ${cacheKey})...`);
        const savedKey = await cache.saveCache([cachePath], cacheKey);
        core.info(`Successfully saved to cache (key: ${savedKey})`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Don't fail the action if caching fails
        core.warning(`Failed to save to cache: ${message}. Installation was successful, cache save is optional.`);
    }
}
//# sourceMappingURL=cache.js.map