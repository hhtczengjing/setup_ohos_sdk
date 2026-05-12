import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'

/**
 * Platform information in the version manifest
 */
export interface PlatformInfo {
  downloadUrl: string
  packageName: string
  sha256?: string
}

/**
 * Version manifest structure
 */
export interface VersionManifest {
  buildVersion: string
  platforms: {
    'windows-x64': PlatformInfo
    'linux-x64': PlatformInfo
    'macos-x64': PlatformInfo
    'macos-arm64': PlatformInfo
  }
}

/**
 * Get version manifest from ohos_command_line_tools repository
 * Tries direct URL first, falls back to GitHub API
 */
export async function getVersionManifest(
  version: string,
  owner: string,
  repo: string
): Promise<VersionManifest> {
  // Try direct GitHub raw content URL first
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/versions/${version}.json`

  try {
    core.debug(`Attempting to fetch manifest from: ${rawUrl}`)
    const response = await fetch(rawUrl)

    if (response.ok) {
      const manifest = (await response.json()) as VersionManifest
      core.info(`Fetched manifest for version ${version} from raw GitHub URL`)
      return manifest
    }

    if (response.status === 404) {
      throw new Error(`Version ${version} not found in repository`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.debug(`Failed to fetch from raw URL: ${message}. Trying GitHub API...`)
  }

  // Fallback to GitHub API
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: `versions/${version}.json`
    })

    if (Array.isArray(response.data)) {
      throw new Error(`Expected a file, got directory`)
    }

    if (response.data.type !== 'file') {
      throw new Error(`Expected a file, got ${response.data.type}`)
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
    const manifest = JSON.parse(content) as VersionManifest
    core.info(`Fetched manifest for version ${version} from GitHub API`)
    return manifest
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch version manifest for ${version}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get latest version number from VERSION file
 * Tries direct URL first, falls back to GitHub API
 */
export async function getLatestVersionNumber(
  owner: string,
  repo: string
): Promise<string> {
  // Try direct GitHub raw content URL first
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/VERSION`

  try {
    core.debug(`Attempting to fetch VERSION file from: ${rawUrl}`)
    const response = await fetch(rawUrl)

    if (response.ok) {
      const version = (await response.text()).trim()
      core.info(`Latest version from VERSION file: ${version}`)
      return version
    }

    if (response.status === 404) {
      throw new Error(`VERSION file not found in repository`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.debug(`Failed to fetch from raw URL: ${message}. Trying GitHub API...`)
  }

  // Fallback to GitHub API
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: 'VERSION'
    })

    if (Array.isArray(response.data)) {
      throw new Error(`Expected a file, got directory`)
    }

    if (response.data.type !== 'file') {
      throw new Error(`Expected a file, got ${response.data.type}`)
    }

    const version = Buffer.from(response.data.content, 'base64').toString('utf-8').trim()
    core.info(`Latest version from VERSION file (via API): ${version}`)
    return version
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch latest version: ${error.message}`)
    }
    throw error
  }
}

/**
 * Resolve version manifest
 * If inputVersion is provided, tries to fetch that version's manifest
 * If not provided or not found, fetches the latest version's manifest
 */
export async function resolveVersionManifest(
  inputVersion: string | undefined,
  owner: string,
  repo: string
): Promise<VersionManifest> {
  let version = inputVersion?.trim()

  if (!version) {
    core.info('No version specified, fetching latest version...')
    version = await getLatestVersionNumber(owner, repo)
  }

  core.info(`Resolving manifest for version: ${version}`)

  try {
    const manifest = await getVersionManifest(version, owner, repo)
    return manifest
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // If user specified a version that doesn't exist, that's a clear error
    if (inputVersion?.trim()) {
      throw new Error(
        `Failed to resolve version ${inputVersion}: ${message}\n` +
          `Available versions can be found at: https://github.com/${owner}/${repo}/tree/master/versions`
      )
    }

    // If we tried to get the latest and it failed, suggest fallback
    throw new Error(
      `Failed to fetch latest version manifest: ${message}\n` +
        `Please check your network connection or specify a version explicitly.`
    )
  }
}
