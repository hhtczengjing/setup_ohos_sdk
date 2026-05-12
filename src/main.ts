import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { getPlatform, getCommandLineToolsDir } from './utils'
import { resolveVersion } from './version'
import { createEnvConfig, setupEnvironment, setOutputs } from './environment'
import { installSdk } from './installer'
import { restoreSdkFromCache, saveSdkToCache } from './cache'

async function run(): Promise<void> {
  try {
    // Get inputs
    const versionInput = core.getInput('version')

    // Detect platform
    core.info('Detecting platform...')
    const platform = getPlatform()
    core.info(`Detected platform: ${platform}`)

    // Get repository info from environment
    // In GitHub Actions, GITHUB_REPOSITORY is set to owner/repo
    const githubRepository = process.env.GITHUB_REPOSITORY
    if (!githubRepository) {
      throw new Error(
        'GITHUB_REPOSITORY environment variable not set. This action must run in GitHub Actions context.'
      )
    }

    const [owner, repo] = githubRepository.split('/')

    // Resolve version
    core.info('Resolving version...')
    const version = await resolveVersion(versionInput, owner, repo)

    // Create environment config
    const envConfig = createEnvConfig(version)
    const commandLineToolsDir = envConfig.commandLineToolDir

    // Try to restore from cache
    const parentDir = path.dirname(commandLineToolsDir)
    let fromCache = false

    if (fs.existsSync(commandLineToolsDir)) {
      core.info('SDK directory already exists, using it')
      fromCache = true
    } else {
      // Try cache restore
      const cacheHit = await restoreSdkFromCache(version, platform, parentDir)
      fromCache = cacheHit

      if (!fromCache) {
        // Install SDK
        core.info('Installing SDK...')
        await installSdk(version, platform, owner, repo)

        // Save to cache
        await saveSdkToCache(version, platform, parentDir)
      }
    }

    // Setup environment
    core.info('Setting up environment variables...')
    setupEnvironment(envConfig)

    // Set outputs
    setOutputs(envConfig)

    if (fromCache) {
      core.info('✓ SDK setup completed (from cache)')
    } else {
      core.info('✓ SDK setup completed (fresh install)')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
  }
}

run()
