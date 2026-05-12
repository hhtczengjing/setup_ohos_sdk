import * as os from 'os'

export type Platform = 'windows-x64' | 'linux-x64' | 'macos-x64' | 'macos-arm64'

/**
 * Detect the current platform
 */
export function getPlatform(): Platform {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'win32') {
    if (arch === 'x64') {
      return 'windows-x64'
    }
    throw new Error(`Unsupported Windows architecture: ${arch}`)
  }

  if (platform === 'linux') {
    if (arch === 'x64') {
      return 'linux-x64'
    }
    throw new Error(`Unsupported Linux architecture: ${arch}`)
  }

  if (platform === 'darwin') {
    if (arch === 'x64') {
      return 'macos-x64'
    }
    if (arch === 'arm64') {
      return 'macos-arm64'
    }
    throw new Error(`Unsupported macOS architecture: ${arch}`)
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

/**
 * Get the base installation directory
 */
export function getInstallBaseDir(): string {
  return `${os.homedir()}/ohos`
}

/**
 * Get the command-line tools directory
 */
export function getCommandLineToolsDir(version: string): string {
  return `${getInstallBaseDir()}/${version}/command-line-tools`
}

/**
 * Get the HOS_SDK_HOME directory
 */
export function getHosSdkHome(version: string): string {
  return `${getCommandLineToolsDir(version)}/sdk`
}

/**
 * Get the HDC tools directory
 */
export function getHdcHome(version: string): string {
  return `${getHosSdkHome(version)}/default/openharmony/toolchains`
}

/**
 * Get the NODE_HOME directory (internal use)
 */
export function getNodeHome(version: string): string {
  return `${getCommandLineToolsDir(version)}/tool/node`
}
