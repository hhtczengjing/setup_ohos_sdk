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
        buildVersion: '6.1.1.268',
        platforms: {
          'windows-x64': {
            downloadUrl: 'https://example.com/commandline-tools-windows-x64-6.1.1.268.zip',
            packageName: 'commandline-tools-windows-x64-6.1.1.268.zip'
          },
          'linux-x64': {
            downloadUrl: 'https://example.com/commandline-tools-linux-x64-6.1.1.268.zip',
            packageName: 'commandline-tools-linux-x64-6.1.1.268.zip'
          },
          'mac-x64': {
            downloadUrl: 'https://example.com/commandline-tools-mac-x64-6.1.1.268.zip',
            packageName: 'commandline-tools-mac-x64-6.1.1.268.zip'
          },
          'mac-arm64': {
            downloadUrl: 'https://example.com/commandline-tools-mac-arm64-6.1.1.268.zip',
            packageName: 'commandline-tools-mac-arm64-6.1.1.268.zip'
          }
        }
      }

      expect(manifest.buildVersion).toBe('6.1.1.268')
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
