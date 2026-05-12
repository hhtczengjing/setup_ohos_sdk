import { VersionManifest } from '../manifest'

describe('Manifest', () => {
  describe('VersionManifest structure', () => {
    it('should have correct structure', () => {
      const manifest: VersionManifest = {
        version: '6.1.1.268',
        platforms: {
          'windows-x64': {
            url: 'https://example.com/commandline-tools-windows-x64-6.1.1.268.zip',
            filename: 'commandline-tools-windows-x64-6.1.1.268.zip'
          },
          'linux-x64': {
            url: 'https://example.com/commandline-tools-linux-x64-6.1.1.268.zip',
            filename: 'commandline-tools-linux-x64-6.1.1.268.zip'
          },
          'macos-x64': {
            url: 'https://example.com/commandline-tools-macos-x64-6.1.1.268.zip',
            filename: 'commandline-tools-macos-x64-6.1.1.268.zip'
          },
          'macos-arm64': {
            url: 'https://example.com/commandline-tools-macos-arm64-6.1.1.268.zip',
            filename: 'commandline-tools-macos-arm64-6.1.1.268.zip'
          }
        }
      }

      expect(manifest.version).toBe('6.1.1.268')
      expect(Object.keys(manifest.platforms)).toEqual([
        'windows-x64',
        'linux-x64',
        'macos-x64',
        'macos-arm64'
      ])
      expect(manifest.platforms['windows-x64'].url).toBeDefined()
      expect(manifest.platforms['windows-x64'].filename).toBeDefined()
    })
  })
})
