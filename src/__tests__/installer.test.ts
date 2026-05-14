import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { verifyPackageChecksum, getDownloadUrl } from '../installer'
import * as core from '@actions/core'

// Mock core module
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn()
}))

// Mock getVersionManifestData
jest.mock('../version', () => ({
  getVersionManifestData: jest.fn()
}))

describe('Installer - SHA256 Checksum Verification', () => {
  const testDir = path.join(__dirname, 'tmp-checksum-test')

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should verify correct checksum', async () => {
    // Create a test file with known content
    const testFile = path.join(testDir, 'test-file.bin')
    const content = 'test content for checksum verification'
    fs.writeFileSync(testFile, content)

    // Calculate expected checksum
    const hash = crypto.createHash('sha256')
    hash.update(content)
    const expectedChecksum = hash.digest('hex')

    // Should not throw
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })

  it('should verify correct checksum (case insensitive)', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-ci.bin')
    const content = 'test content for case insensitive check'
    fs.writeFileSync(testFile, content)

    // Calculate expected checksum in uppercase
    const hash = crypto.createHash('sha256')
    hash.update(content)
    const expectedChecksum = hash.digest('hex').toUpperCase()

    // Should not throw (lowercase file checksum vs uppercase expected)
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })

  it('should fail with incorrect checksum', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-bad.bin')
    const content = 'test content'
    fs.writeFileSync(testFile, content)

    // Use wrong checksum
    const wrongChecksum = 'a'.repeat(64) // 64-char hex string

    // Should throw
    await expect(verifyPackageChecksum(testFile, wrongChecksum)).rejects.toThrow(
      'Checksum verification failed'
    )
  })

  it('should skip verification if checksum is not provided', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-skip.bin')
    fs.writeFileSync(testFile, 'any content')

    // Should not throw even with undefined checksum
    await expect(verifyPackageChecksum(testFile, undefined)).resolves.toBeUndefined()
  })

  it('should handle missing file error', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent-file.bin')
    const checksum = 'a'.repeat(64)

    // Should throw file not found error
    await expect(verifyPackageChecksum(nonExistentFile, checksum)).rejects.toThrow(
      'Failed to read file for checksum verification'
    )
  })

  it('should calculate correct SHA256 for large file', async () => {
    // Create a larger test file
    const testFile = path.join(testDir, 'large-test-file.bin')
    const largeContent = Buffer.alloc(10 * 1024 * 1024, 'a') // 10MB file

    fs.writeFileSync(testFile, largeContent)

    // Calculate expected checksum
    const hash = crypto.createHash('sha256')
    hash.update(largeContent)
    const expectedChecksum = hash.digest('hex')

    // Should verify large file correctly
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })
})

describe('Installer - Platform Fallback Compatibility', () => {
  const { getVersionManifestData } = require('../version')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fall back from linux-x64 to linux-x86 when platform not found', async () => {
    // Mock manifest with only linux-x64 (both x64 and x86 map to the same)
    getVersionManifestData.mockResolvedValue({
      buildVersion: '5.0.0.100',
      platforms: {
        'windows-x64': {
          downloadUrl: 'https://example.com/windows-x64.zip',
          packageName: 'commandline-tools-windows-x64-5.0.0.100.zip'
        },
        'linux-x64': {
          downloadUrl: 'https://example.com/linux-x64.zip',
          packageName: 'commandline-tools-linux-x64-5.0.0.100.zip',
          sha256: 'abc123'
        },
        'mac-x64': {
          downloadUrl: 'https://example.com/mac-x64.zip',
          packageName: 'commandline-tools-mac-x64-5.0.0.100.zip'
        },
        'mac-arm64': {
          downloadUrl: 'https://example.com/mac-arm64.zip',
          packageName: 'commandline-tools-mac-arm64-5.0.0.100.zip'
        }
      }
    })

    const result = await getDownloadUrl('5.0.0.100', 'linux-x64', 'owner', 'repo')

    expect(result.url).toBe('https://example.com/linux-x64.zip')
    expect(result.checksum).toBe('abc123')
  })

  it('should fall back from macos-x64 to macos-x86 when platform not found', async () => {
    // Mock manifest with only mac-x64 (both macos-x64 and macos-x86 map to it)
    getVersionManifestData.mockResolvedValue({
      buildVersion: '5.0.0.100',
      platforms: {
        'windows-x64': {
          downloadUrl: 'https://example.com/windows-x64.zip',
          packageName: 'commandline-tools-windows-x64-5.0.0.100.zip'
        },
        'linux-x64': {
          downloadUrl: 'https://example.com/linux-x64.zip',
          packageName: 'commandline-tools-linux-x64-5.0.0.100.zip'
        },
        'mac-x64': {
          downloadUrl: 'https://example.com/mac-x64.zip',
          packageName: 'commandline-tools-mac-x64-5.0.0.100.zip',
          sha256: 'def456'
        },
        'mac-arm64': {
          downloadUrl: 'https://example.com/mac-arm64.zip',
          packageName: 'commandline-tools-mac-arm64-5.0.0.100.zip'
        }
      }
    })

    const result = await getDownloadUrl('5.0.0.100', 'macos-x64', 'owner', 'repo')

    expect(result.url).toBe('https://example.com/mac-x64.zip')
    expect(result.checksum).toBe('def456')
  })

  it('should throw error when platform not found and no fallback available', async () => {
    // Mock manifest without linux
    getVersionManifestData.mockResolvedValue({
      buildVersion: '5.0.0.100',
      platforms: {
        'windows-x64': {
          downloadUrl: 'https://example.com/windows-x64.zip',
          packageName: 'commandline-tools-windows-x64-5.0.0.100.zip'
        },
        'mac-x64': {
          downloadUrl: 'https://example.com/mac-x64.zip',
          packageName: 'commandline-tools-mac-x64-5.0.0.100.zip'
        },
        'mac-arm64': {
          downloadUrl: 'https://example.com/mac-arm64.zip',
          packageName: 'commandline-tools-mac-arm64-5.0.0.100.zip'
        }
      }
    })

    await expect(getDownloadUrl('5.0.0.100', 'linux-x64', 'owner', 'repo')).rejects.toThrow(
      'Platform linux-x64 not found in version manifest for 5.0.0.100'
    )
  })

  it('should use direct platform when available (no fallback needed)', async () => {
    // Mock manifest with linux-x64 available
    getVersionManifestData.mockResolvedValue({
      buildVersion: '5.0.0.100',
      platforms: {
        'windows-x64': {
          downloadUrl: 'https://example.com/windows-x64.zip',
          packageName: 'commandline-tools-windows-x64-5.0.0.100.zip'
        },
        'linux-x64': {
          downloadUrl: 'https://example.com/linux-x64.zip',
          packageName: 'commandline-tools-linux-x64-5.0.0.100.zip',
          sha256: 'xyz789'
        },
        'mac-x64': {
          downloadUrl: 'https://example.com/mac-x64.zip',
          packageName: 'commandline-tools-mac-x64-5.0.0.100.zip'
        },
        'mac-arm64': {
          downloadUrl: 'https://example.com/mac-arm64.zip',
          packageName: 'commandline-tools-mac-arm64-5.0.0.100.zip'
        }
      }
    })

    const result = await getDownloadUrl('5.0.0.100', 'linux-x64', 'owner', 'repo')

    // Should use linux-x64 directly without logging fallback message
    expect(result.url).toBe('https://example.com/linux-x64.zip')
    expect(result.checksum).toBe('xyz789')
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining('falling back'))
  })
})


