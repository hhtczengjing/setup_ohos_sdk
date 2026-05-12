import { isValidVersion, compareVersions } from '../version'
import { getPackageName, getPlatform } from '../utils'

describe('Version Management', () => {
  describe('isValidVersion', () => {
    it('should accept valid version format', () => {
      expect(isValidVersion('5.0.11.100')).toBe(true)
      expect(isValidVersion('1.0.0.0')).toBe(true)
      expect(isValidVersion('10.20.30.40')).toBe(true)
    })

    it('should reject invalid version formats', () => {
      expect(isValidVersion('5.0.11')).toBe(false)
      expect(isValidVersion('v5.0.11.100')).toBe(false)
      expect(isValidVersion('5.0.11.100.0')).toBe(false)
      expect(isValidVersion('latest')).toBe(false)
      expect(isValidVersion('')).toBe(false)
    })
  })

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('5.0.10.0', '5.0.11.100')).toBe(-1)
      expect(compareVersions('5.0.11.100', '5.0.11.100')).toBe(0)
      expect(compareVersions('6.0.0.0', '5.0.11.100')).toBe(1)
      expect(compareVersions('5.1.0.0', '5.0.11.100')).toBe(1)
    })
  })
})

describe('Utils', () => {
  describe('getPackageName', () => {
    it('should generate correct package names for all platforms', () => {
      const version = '5.0.11.100'

      expect(getPackageName(version, 'windows-x64')).toBe(
        'ohos_command_line_tools-5.0.11.100-windows-x64.zip'
      )
      expect(getPackageName(version, 'linux-x64')).toBe(
        'ohos_command_line_tools-5.0.11.100-linux-x64.zip'
      )
      expect(getPackageName(version, 'macos-x64')).toBe(
        'ohos_command_line_tools-5.0.11.100-macos-x64.zip'
      )
      expect(getPackageName(version, 'macos-arm64')).toBe(
        'ohos_command_line_tools-5.0.11.100-macos-arm64.zip'
      )
    })
  })

  describe('Platform detection', () => {
    it('should detect current platform', () => {
      const platform = getPlatform()
      expect(platform).toMatch(/^(windows-x64|linux-x64|macos-x64|macos-arm64)$/)
    })
  })
})
