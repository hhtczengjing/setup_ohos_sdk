/**
 * Integration test - verifies manifest module exports and types
 */

import {
  VersionManifest,
  PlatformInfo,
  getVersionManifest,
  getLatestVersionNumber,
  resolveVersionManifest
} from '../manifest'

import { isValidVersion, compareVersions, resolveVersion, getVersionManifestData } from '../version'

describe('Integration - Manifest and Version', () => {
  describe('Module exports', () => {
    it('should export VersionManifest interface', () => {
      const manifest: VersionManifest = {
        version: '5.0.11.100',
        platforms: {
          'windows-x64': {
            url: 'https://example.com/windows.zip',
            filename: 'test.zip'
          },
          'linux-x64': {
            url: 'https://example.com/linux.zip',
            filename: 'test.zip'
          },
          'macos-x64': {
            url: 'https://example.com/macos-x64.zip',
            filename: 'test.zip'
          },
          'macos-arm64': {
            url: 'https://example.com/macos-arm64.zip',
            filename: 'test.zip'
          }
        }
      }

      expect(manifest.version).toBe('5.0.11.100')
      expect(manifest.platforms['windows-x64']).toBeDefined()
    })

    it('should export version functions', () => {
      expect(typeof isValidVersion).toBe('function')
      expect(typeof compareVersions).toBe('function')
      expect(typeof resolveVersion).toBe('function')
      expect(typeof getVersionManifestData).toBe('function')
    })

    it('should export manifest functions', () => {
      expect(typeof getVersionManifest).toBe('function')
      expect(typeof getLatestVersionNumber).toBe('function')
      expect(typeof resolveVersionManifest).toBe('function')
    })
  })
})
