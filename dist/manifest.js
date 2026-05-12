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
exports.getVersionManifest = getVersionManifest;
exports.getLatestVersionNumber = getLatestVersionNumber;
exports.resolveVersionManifest = resolveVersionManifest;
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
/**
 * Get version manifest from ohos_command_line_tools repository
 * Tries direct URL first, falls back to GitHub API
 */
async function getVersionManifest(version, owner, repo) {
    // Try direct GitHub raw content URL first
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/versions/${version}.json`;
    try {
        core.debug(`Attempting to fetch manifest from: ${rawUrl}`);
        const response = await fetch(rawUrl);
        if (response.ok) {
            const manifest = (await response.json());
            core.info(`Fetched manifest for version ${version} from raw GitHub URL`);
            return manifest;
        }
        if (response.status === 404) {
            throw new Error(`Version ${version} not found in repository`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        core.debug(`Failed to fetch from raw URL: ${message}. Trying GitHub API...`);
    }
    // Fallback to GitHub API
    try {
        const octokit = new rest_1.Octokit({
            auth: process.env.GITHUB_TOKEN
        });
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: `versions/${version}.json`
        });
        if (Array.isArray(response.data)) {
            throw new Error(`Expected a file, got directory`);
        }
        if (response.data.type !== 'file') {
            throw new Error(`Expected a file, got ${response.data.type}`);
        }
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        const manifest = JSON.parse(content);
        core.info(`Fetched manifest for version ${version} from GitHub API`);
        return manifest;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch version manifest for ${version}: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Get latest version number from VERSION file
 * Tries direct URL first, falls back to GitHub API
 */
async function getLatestVersionNumber(owner, repo) {
    // Try direct GitHub raw content URL first
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/VERSION`;
    try {
        core.debug(`Attempting to fetch VERSION file from: ${rawUrl}`);
        const response = await fetch(rawUrl);
        if (response.ok) {
            const version = (await response.text()).trim();
            core.info(`Latest version from VERSION file: ${version}`);
            return version;
        }
        if (response.status === 404) {
            throw new Error(`VERSION file not found in repository`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        core.debug(`Failed to fetch from raw URL: ${message}. Trying GitHub API...`);
    }
    // Fallback to GitHub API
    try {
        const octokit = new rest_1.Octokit({
            auth: process.env.GITHUB_TOKEN
        });
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: 'VERSION'
        });
        if (Array.isArray(response.data)) {
            throw new Error(`Expected a file, got directory`);
        }
        if (response.data.type !== 'file') {
            throw new Error(`Expected a file, got ${response.data.type}`);
        }
        const version = Buffer.from(response.data.content, 'base64').toString('utf-8').trim();
        core.info(`Latest version from VERSION file (via API): ${version}`);
        return version;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch latest version: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Resolve version manifest
 * If inputVersion is provided, tries to fetch that version's manifest
 * If not provided or not found, fetches the latest version's manifest
 */
async function resolveVersionManifest(inputVersion, owner, repo) {
    let version = inputVersion?.trim();
    if (!version) {
        core.info('No version specified, fetching latest version...');
        version = await getLatestVersionNumber(owner, repo);
    }
    core.info(`Resolving manifest for version: ${version}`);
    try {
        const manifest = await getVersionManifest(version, owner, repo);
        return manifest;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // If user specified a version that doesn't exist, that's a clear error
        if (inputVersion?.trim()) {
            throw new Error(`Failed to resolve version ${inputVersion}: ${message}\n` +
                `Available versions can be found at: https://github.com/${owner}/${repo}/tree/master/versions`);
        }
        // If we tried to get the latest and it failed, suggest fallback
        throw new Error(`Failed to fetch latest version manifest: ${message}\n` +
            `Please check your network connection or specify a version explicitly.`);
    }
}
//# sourceMappingURL=manifest.js.map