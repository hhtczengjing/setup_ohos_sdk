import { VersionManifest } from '../manifest'

describe('Manifest', () => {
  describe('VersionManifest structure', () => {
    it('should have correct structure', () => {
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
          'macos-x64': {
            downloadUrl: 'https://example.com/commandline-tools-macos-x64-6.1.1.268.zip',
            packageName: 'commandline-tools-macos-x64-6.1.1.268.zip'
          },
          'macos-arm64': {
            downloadUrl: 'https://example.com/commandline-tools-macos-arm64-6.1.1.268.zip',
            packageName: 'commandline-tools-macos-arm64-6.1.1.268.zip'
          }
        }
      }

      expect(manifest.buildVersion).toBe('6.1.1.268')
      expect(Object.keys(manifest.platforms)).toEqual([
        'windows-x64',
        'linux-x64',
        'macos-x64',
        'macos-arm64'
      ])
      expect(manifest.platforms['windows-x64'].downloadUrl).toBeDefined()
      expect(manifest.platforms['windows-x64'].packageName).toBeDefined()
    })
  })
})
