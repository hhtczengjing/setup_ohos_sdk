import { isValidVersion, compareVersions } from '../version'
import { getPlatform, getCommandLineToolsDir } from '../utils'

describe('Version Management', () => {
  describe('isValidVersion', () => {
    it('should accept valid version format', () => {
      expect(isValidVersion('5.0.11.100')).toBe(true)
      expect(isValidVersion('1.0.0.0')).toBe(true)
      expect(isValidVersion('10.20.30.40')).toBe(true)
    })

    it('should reject invalid version format', () => {
      expect(isValidVersion('5.0.11')).toBe(false)
      expect(isValidVersion('v5.0.11.100')).toBe(false)
      expect(isValidVersion('latest')).toBe(false)
      expect(isValidVersion('')).toBe(false)
    })
  })

  describe('compareVersions', () => {
    it('should correctly compare versions', () => {
      expect(compareVersions('5.0.11.100', '5.0.11.100')).toBe(0)
      expect(compareVersions('5.0.11.100', '5.0.11.99')).toBe(1)
      expect(compareVersions('5.0.11.99', '5.0.11.100')).toBe(-1)
      expect(compareVersions('5.0.12.0', '5.0.11.100')).toBe(1)
      expect(compareVersions('4.9.9.9', '5.0.0.0')).toBe(-1)
    })
  })
})

describe('Utils', () => {
  describe('Path generation', () => {
    it('should generate correct installation paths', () => {
      const version = '5.0.11.100'
      const homeDir = require('os').homedir()

      const cmdToolDir = getCommandLineToolsDir(version)
      expect(cmdToolDir).toContain(`ohos/${version}/command-line-tools`)
      expect(cmdToolDir).toContain(homeDir)
    })
  })

  describe('getPlatform', () => {
    it('should detect current platform', () => {
      const platform = getPlatform()
      expect(['windows-x64', 'linux-x64', 'macos-x64', 'macos-arm64']).toContain(platform)
    })
  })
})
