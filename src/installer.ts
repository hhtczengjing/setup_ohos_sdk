import * as fs from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as crypto from 'crypto'
import { Platform, getCommandLineToolsDir, getInstallBaseDir } from './utils'
import { getVersionManifestData } from './version'

/**
 * Platform info with URL and checksum
 */
interface PlatformDownloadInfo {
  url: string
  checksum?: string
}

/**
 * Get the download URL and checksum for a specific version and platform from manifest
 * Falls back to compatible platform if not found (e.g., linux-x64 -> linux-x86)
 */
export async function getDownloadUrl(
  version: string,
  platform: Platform,
  owner: string,
  repo: string
): Promise<PlatformDownloadInfo> {
  const manifest = await getVersionManifestData(version, owner, repo)
  let platformInfo = manifest.platforms[platform]

  // Fallback to compatible platform if not found
  if (!platformInfo) {
    const fallback = getFallbackPlatform(platform)
    if (fallback) {
      core.info(`Platform ${platform} not found, falling back to ${fallback}`)
      platformInfo = manifest.platforms[fallback]
    }
  }

  if (!platformInfo) {
    throw new Error(`Platform ${platform} not found in version manifest for ${version}`)
  }

  return {
    url: platformInfo.downloadUrl,
    checksum: platformInfo.sha256
  }
}

/**
 * Get fallback platform for compatibility
 * e.g., linux-x64 -> linux-x86, macos-x64 -> macos-x86
 */
function getFallbackPlatform(platform: Platform): Platform | null {
  const fallbackMap: Record<string, Platform> = {
    'linux-x64': 'linux-x86',
    'macos-x64': 'macos-x86'
  }
  return fallbackMap[platform] || null
}

/**
 * Download result with path and checksum
 */
interface DownloadResult {
  path: string
  checksum?: string
}

/**
 * Download the SDK package
 */
export async function downloadPackage(
  version: string,
  platform: Platform,
  owner: string,
  repo: string,
  retries: number = 3
): Promise<DownloadResult> {
  const downloadInfo = await getDownloadUrl(version, platform, owner, repo)
  const packageName = path.basename(downloadInfo.url)

  core.info(`Downloading ${packageName}...`)

  let lastError: Error | undefined
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const downloadPath = await tc.downloadTool(downloadInfo.url)
      core.info(`Downloaded to: ${downloadPath}`)
      return {
        path: downloadPath,
        checksum: downloadInfo.checksum
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        core.warning(
          `Download attempt ${attempt} failed: ${lastError.message}. Retrying...`
        )
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  throw new Error(
    `Failed to download SDK for version ${version} after ${retries} attempts. ` +
      `Last error: ${lastError?.message}. ` +
      `Download URL: ${downloadInfo.url}`
  )
}

/**
 * Verify the downloaded package checksum (SHA256)
 * If checksum is provided in manifest, validates the downloaded file
 * If checksum is not provided, logs a warning and continues
 */
export async function verifyPackageChecksum(
  downloadPath: string,
  expectedChecksum: string | undefined
): Promise<void> {
  if (!expectedChecksum) {
    core.warning('No checksum provided in manifest, skipping verification')
    return
  }

  core.info('Verifying package checksum...')

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(downloadPath)

    stream.on('error', error => {
      reject(new Error(`Failed to read file for checksum verification: ${error.message}`))
    })

    stream.on('data', chunk => {
      hash.update(chunk)
    })

    stream.on('end', () => {
      const fileChecksum = hash.digest('hex')
      const expectedLower = expectedChecksum.toLowerCase()
      const fileLower = fileChecksum.toLowerCase()

      if (fileLower === expectedLower) {
        core.info(`Checksum verified: ${fileChecksum}`)
        resolve()
      } else {
        reject(
          new Error(
            `Checksum verification failed.\n` +
              `Expected: ${expectedLower}\n` +
              `Got:      ${fileLower}`
          )
        )
      }
    })
  })
}

/**
 * Extract the downloaded package directly to final location
 * Uses native unzip command to preserve symlinks
 */
export async function extractPackage(
  downloadPath: string,
  platform: Platform,
  extractDir: string
): Promise<string> {
  core.info(`Extracting package to ${extractDir}...`)

  // Create extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true })
  }

  try {
    // Use native unzip command to preserve symlinks on Linux/macOS
    if (process.platform !== 'win32') {
      core.info('Using native unzip command to preserve symlinks...')
      await exec.exec('unzip', ['-q', downloadPath, '-d', extractDir])
      const extractedPath = extractDir
      core.info(`Extracted to: ${extractedPath}`)
      return extractedPath
    } else {
      // On Windows, use tool-cache's extractZip
      core.info('Using tool-cache extractZip for Windows...')
      const extractedPath = await tc.extractZip(downloadPath, extractDir)
      core.info(`Extracted to: ${extractedPath}`)
      return extractedPath
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract package: ${message}`)
  }
}

/**
 * Verify the extracted SDK structure
 */
export async function verifySdkStructure(commandLineToolsDir: string): Promise<void> {
  core.info('Verifying SDK structure...')

  const requiredDirs = [
    { path: 'bin', desc: 'bin directory' },
    { path: 'sdk/default/openharmony/toolchains', desc: 'HDC toolchains directory' },
    { path: 'tool/node/bin', desc: 'Node.js bin directory' }
  ]

  const missingDirs: string[] = []

  for (const { path: relPath, desc } of requiredDirs) {
    const fullPath = path.join(commandLineToolsDir, relPath)
    if (!fs.existsSync(fullPath)) {
      missingDirs.push(`${desc} (${relPath})`)
    }
  }

  if (missingDirs.length > 0) {
    throw new Error(
      `SDK structure verification failed. Missing directories:\n  - ${missingDirs.join('\n  - ')}`
    )
  }

  core.info('SDK structure verified successfully')
}

/**
 * Set executable permissions on Linux/macOS
 */
export async function setExecutablePermissions(commandLineToolsDir: string): Promise<void> {
  if (process.platform === 'win32') {
    return // Skip on Windows
  }

  core.info('Setting executable permissions...')

  try {
    // Make scripts in bin directory executable
    const binDir = path.join(commandLineToolsDir, 'bin')
    if (fs.existsSync(binDir)) {
      await exec.exec('chmod', ['-R', '+x', binDir])
    }

    // Make Node.js executable
    const nodeDir = path.join(commandLineToolsDir, 'tool/node/bin')
    if (fs.existsSync(nodeDir)) {
      await exec.exec('chmod', ['-R', '+x', nodeDir])
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.warning(`Failed to set executable permissions: ${message}`)
  }
}

/**
 * Install the SDK
 */
export async function installSdk(
  version: string,
  platform: Platform,
  owner: string,
  repo: string
): Promise<string> {
  const commandLineToolsDir = getCommandLineToolsDir(version)
  const installBaseDir = getInstallBaseDir()

  // If already installed, return the path
  if (fs.existsSync(commandLineToolsDir)) {
    core.info(`SDK already installed at ${commandLineToolsDir}`)
    return commandLineToolsDir
  }

  // Download the package
  const downloadResult = await downloadPackage(version, platform, owner, repo)
  const downloadPath = downloadResult.path

  try {
    // Verify checksum if provided
    await verifyPackageChecksum(downloadPath, downloadResult.checksum)

    // Ensure base directory exists
    const finalDir = path.join(installBaseDir, version)
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true })
    }

    // Extract directly to final location
    // This preserves symlinks on Linux/macOS
    core.info('Extracting SDK package...')
    const extractedPath = await extractPackage(downloadPath, platform, finalDir)

    // Handle nested extraction (if zip contains a "command-line-tools" folder)
    const possibleNestedDir = path.join(extractedPath, 'command-line-tools')
    if (fs.existsSync(possibleNestedDir)) {
      core.info('Moving nested command-line-tools directory to parent...')

      // If command-line-tools already exists at final location, just merge the contents
      if (fs.existsSync(commandLineToolsDir)) {
        // Merge nested into existing
        moveDir(possibleNestedDir, commandLineToolsDir)
      } else {
        // Rename the nested directory to final location
        fs.renameSync(possibleNestedDir, commandLineToolsDir)
      }
    }

    // Verify the structure
    await verifySdkStructure(commandLineToolsDir)

    // Set executable permissions
    await setExecutablePermissions(commandLineToolsDir)

    core.info(`SDK installed successfully at ${commandLineToolsDir}`)
    return commandLineToolsDir
  } catch (error) {
    // Clean up on failure
    fs.rmSync(path.join(installBaseDir, version), { recursive: true, force: true })
    throw error
  }
}

/**
 * Move directory while preserving symlinks
 * Handles conflicts by removing destination if it exists
 */
function moveDir(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const files = fs.readdirSync(src)

  for (const file of files) {
    const srcPath = path.join(src, file)
    const destPath = path.join(dest, file)
    const stat = fs.lstatSync(srcPath)

    // Always remove destination if it exists to avoid conflicts
    if (fs.existsSync(destPath) || fs.lstatSync(destPath)) {
      try {
        const destStat = fs.lstatSync(destPath)
        if (destStat.isSymbolicLink() || !destStat.isDirectory()) {
          fs.unlinkSync(destPath)
        } else {
          fs.rmSync(destPath, { recursive: true, force: true })
        }
      } catch {
        // Ignore if dest doesn't exist or can't be stat'd
      }
    }

    if (stat.isSymbolicLink()) {
      // Handle symlinks - recreate at destination
      const linkTarget = fs.readlinkSync(srcPath)
      fs.symlinkSync(linkTarget, destPath)
    } else if (stat.isDirectory()) {
      // Recursively move directories
      moveDir(srcPath, destPath)
    } else {
      // Move regular files
      fs.renameSync(srcPath, destPath)
    }
  }
}
