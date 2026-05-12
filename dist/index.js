"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const version_1 = require("./version");
const environment_1 = require("./environment");
const installer_1 = require("./installer");
const cache_1 = require("./cache");
async function run() {
    try {
        // Get inputs
        const versionInput = core.getInput('version');
        // Detect platform
        core.info('Detecting platform...');
        const platform = (0, utils_1.getPlatform)();
        core.info(`Detected platform: ${platform}`);
        // Get repository info from environment
        // In GitHub Actions, GITHUB_REPOSITORY is set to owner/repo
        const githubRepository = process.env.GITHUB_REPOSITORY;
        if (!githubRepository) {
            throw new Error('GITHUB_REPOSITORY environment variable not set. This action must run in GitHub Actions context.');
        }
        const [owner, repo] = githubRepository.split('/');
        // Resolve version
        core.info('Resolving version...');
        const version = await (0, version_1.resolveVersion)(versionInput, owner, repo);
        // Create environment config
        const envConfig = (0, environment_1.createEnvConfig)(version);
        const commandLineToolsDir = envConfig.commandLineToolDir;
        // Try to restore from cache
        const parentDir = path.dirname(commandLineToolsDir);
        let fromCache = false;
        if (fs.existsSync(commandLineToolsDir)) {
            core.info('SDK directory already exists, using it');
            fromCache = true;
        }
        else {
            // Try cache restore
            const cacheHit = await (0, cache_1.restoreSdkFromCache)(version, platform, parentDir);
            fromCache = cacheHit;
            if (!fromCache) {
                // Install SDK
                core.info('Installing SDK...');
                await (0, installer_1.installSdk)(version, platform, owner, repo);
                // Save to cache
                await (0, cache_1.saveSdkToCache)(version, platform, parentDir);
            }
        }
        // Setup environment
        core.info('Setting up environment variables...');
        (0, environment_1.setupEnvironment)(envConfig);
        // Set outputs
        (0, environment_1.setOutputs)(envConfig);
        if (fromCache) {
            core.info('✓ SDK setup completed (from cache)');
        }
        else {
            core.info('✓ SDK setup completed (fresh install)');
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        core.setFailed(message);
    }
}
run();
//# sourceMappingURL=main.js.map