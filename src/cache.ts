import * as core from '@actions/core'
import * as cache from '@actions/cache'
import * as fs from 'fs'
import { Platform } from './utils'

/**
 * Generate cache key
 */
export function getCacheKey(version: string, platform: Platform): string {
  return `ohos-sdk-${version}-${platform}`
}

/**
 * Try to restore SDK from cache
 */
export async function restoreSdkFromCache(
  version: string,
  platform: Platform,
  cachePath: string
): Promise<boolean> {
  const cacheKey = getCacheKey(version, platform)

  try {
    core.info(`Trying to restore SDK from cache (key: ${cacheKey})...`)

    // Check if path exists first
    if (!fs.existsSync(cachePath)) {
      core.info('Cache path does not exist, skipping cache restore')
      return false
    }

    const restoredKey = await cache.restoreCache([cachePath], cacheKey)

    if (restoredKey) {
      core.info(`Cache hit! Restored from cache (key: ${restoredKey})`)
      return true
    }

    core.info('Cache miss, will download and install')
    return false
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.warning(`Failed to restore from cache: ${message}. Continuing with fresh install...`)
    return false
  }
}

/**
 * Save SDK to cache
 */
export async function saveSdkToCache(
  version: string,
  platform: Platform,
  cachePath: string
): Promise<void> {
  const cacheKey = getCacheKey(version, platform)

  try {
    // Check if path exists
    if (!fs.existsSync(cachePath)) {
      core.warning(`Cache path does not exist: ${cachePath}`)
      return
    }

    core.info(`Saving SDK to cache (key: ${cacheKey})...`)

    const savedKey = await cache.saveCache([cachePath], cacheKey)
    core.info(`Successfully saved to cache (key: ${savedKey})`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Don't fail the action if caching fails
    core.warning(`Failed to save to cache: ${message}. Installation was successful, cache save is optional.`)
  }
}
