import * as core from '@actions/core'
import { getCommandLineToolsDir, getHosSdkHome, getHdcHome, getNodeHome } from './utils'

export interface EnvConfig {
  version: string
  commandLineToolDir: string
  hosSdkHome: string
  hdcHome: string
  nodeHome: string
}

/**
 * Create environment configuration for a given version
 */
export function createEnvConfig(version: string): EnvConfig {
  return {
    version,
    commandLineToolDir: getCommandLineToolsDir(version),
    hosSdkHome: getHosSdkHome(version),
    hdcHome: getHdcHome(version),
    nodeHome: getNodeHome(version)
  }
}

/**
 * Setup environment variables
 */
export function setupEnvironment(config: EnvConfig): void {
  core.exportVariable('COMMANDLINE_TOOLS_VERSION', config.version)
  core.exportVariable('COMMANDLINE_TOOL_DIR', config.commandLineToolDir)
  core.exportVariable('HOS_SDK_HOME', config.hosSdkHome)
  core.exportVariable('HDC_HOME', config.hdcHome)
  core.exportVariable('NODE_HOME', config.nodeHome)

  // Add to PATH
  core.addPath(`${config.commandLineToolDir}/bin`)
  core.addPath(config.hdcHome)
  core.addPath(`${config.nodeHome}/bin`)

  core.info('Environment variables configured')
}

/**
 * Set action outputs
 */
export function setOutputs(config: EnvConfig): void {
  core.setOutput('command-line-tools-path', config.commandLineToolDir)
  core.setOutput('sdk-home', config.hosSdkHome)
  core.setOutput('hdc-home', config.hdcHome)

  core.info('Outputs set')
}
