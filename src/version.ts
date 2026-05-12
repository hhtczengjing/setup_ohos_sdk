import * as core from '@actions/core'
import { getLatestVersionNumber, getVersionManifest, VersionManifest } from './manifest'

const VERSION_REGEX = /^\d+\.\d+\.\d+\.\d+$/

/**
 * Validate version format
 */
export function isValidVersion(version: string): boolean {
  return VERSION_REGEX.test(version)
}

/**
 * Parse version string into numeric array for comparison
 */
function parseVersion(version: string): number[] {
  return version.split('.').map(Number)
}

/**
 * Compare two versions
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1)
  const parts2 = parseVersion(v2)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 < num2) return -1
    if (num1 > num2) return 1
  }

  return 0
}

/**
 * Get the latest version from VERSION file in ohos_command_line_tools repository
 */
export async function getLatestVersion(owner: string, repo: string): Promise<string> {
  try {
    const version = await getLatestVersionNumber(owner, repo)

    if (!isValidVersion(version)) {
      throw new Error(`Invalid version format in VERSION file: ${version}`)
    }

    core.info(`Latest version: ${version}`)
    return version
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get latest version: ${error.message}`)
    }
    throw error
  }
}

/**
 * Resolve version - use provided version or fetch latest
 */
export async function resolveVersion(
  inputVersion: string,
  owner: string,
  repo: string
): Promise<string> {
  let version = inputVersion.trim()

  if (!version) {
    core.info('No version specified, fetching latest version...')
    version = await getLatestVersion(owner, repo)
  }

  if (!isValidVersion(version)) {
    throw new Error(
      `Invalid version format: ${version}. Expected format: X.X.X.X (e.g., 5.0.11.100)`
    )
  }

  // Verify the version exists in the repository by fetching its manifest
  try {
    await getVersionManifest(version, owner, repo)
    core.info(`Using SDK version: ${version}`)
    return version
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Version ${version} is not available: ${message}\n` +
        `Available versions can be found at: https://github.com/${owner}/${repo}/tree/main/versions`
    )
  }
}

/**
 * Get version manifest (platform information and download URLs)
 */
export async function getVersionManifestData(
  version: string,
  owner: string,
  repo: string
): Promise<VersionManifest> {
  return getVersionManifest(version, owner, repo)
}
