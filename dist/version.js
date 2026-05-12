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
exports.isValidVersion = isValidVersion;
exports.compareVersions = compareVersions;
exports.getLatestVersion = getLatestVersion;
exports.resolveVersion = resolveVersion;
exports.getVersionManifestData = getVersionManifestData;
const core = __importStar(require("@actions/core"));
const manifest_1 = require("./manifest");
const VERSION_REGEX = /^\d+\.\d+\.\d+\.\d+$/;
/**
 * Validate version format
 */
function isValidVersion(version) {
    return VERSION_REGEX.test(version);
}
/**
 * Parse version string into numeric array for comparison
 */
function parseVersion(version) {
    return version.split('.').map(Number);
}
/**
 * Compare two versions
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
    const parts1 = parseVersion(v1);
    const parts2 = parseVersion(v2);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 < num2)
            return -1;
        if (num1 > num2)
            return 1;
    }
    return 0;
}
/**
 * Get the latest version from VERSION file in ohos_command_line_tools repository
 */
async function getLatestVersion(owner, repo) {
    try {
        const version = await (0, manifest_1.getLatestVersionNumber)(owner, repo);
        if (!isValidVersion(version)) {
            throw new Error(`Invalid version format in VERSION file: ${version}`);
        }
        core.info(`Latest version: ${version}`);
        return version;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get latest version: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Resolve version - use provided version or fetch latest
 */
async function resolveVersion(inputVersion, owner, repo) {
    let version = inputVersion.trim();
    if (!version) {
        core.info('No version specified, fetching latest version...');
        version = await getLatestVersion(owner, repo);
    }
    if (!isValidVersion(version)) {
        throw new Error(`Invalid version format: ${version}. Expected format: X.X.X.X (e.g., 5.0.11.100)`);
    }
    // Verify the version exists in the repository by fetching its manifest
    try {
        await (0, manifest_1.getVersionManifest)(version, owner, repo);
        core.info(`Using SDK version: ${version}`);
        return version;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Version ${version} is not available: ${message}\n` +
            `Available versions can be found at: https://github.com/${owner}/${repo}/tree/main/versions`);
    }
}
/**
 * Get version manifest (platform information and download URLs)
 */
async function getVersionManifestData(version, owner, repo) {
    return (0, manifest_1.getVersionManifest)(version, owner, repo);
}
//# sourceMappingURL=version.js.map