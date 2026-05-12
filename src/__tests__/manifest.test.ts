import { VersionManifest } from '../manifest'

describe('Manifest', () => {
  describe('VersionManifest structure', () => {
    it('should have correct structure', () => {
      const manifest: VersionManifest = {
        version: '5.0.11.100',
        platforms: {
          'windows-x64': {
            url: 'https://example.com/windows-x64.zip',
            filename: 'ohos_command_line_tools-5.0.11.100-windows-x64.zip'
          },
          'linux-x64': {
            url: 'https://example.com/linux-x64.zip',
            filename: 'ohos_command_line_tools-5.0.11.100-linux-x64.zip'
          },
          'macos-x64': {
            url: 'https://example.com/macos-x64.zip',
            filename: 'ohos_command_line_tools-5.0.11.100-macos-x64.zip'
          },
          'macos-arm64': {
            url: 'https://example.com/macos-arm64.zip',
            filename: 'ohos_command_line_tools-5.0.11.100-macos-arm64.zip'
          }
        }
      }

      expect(manifest.version).toBe('5.0.11.100')
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
