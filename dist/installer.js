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
exports.getDownloadUrl = getDownloadUrl;
exports.downloadPackage = downloadPackage;
exports.verifyPackageChecksum = verifyPackageChecksum;
exports.extractPackage = extractPackage;
exports.verifySdkStructure = verifySdkStructure;
exports.setExecutablePermissions = setExecutablePermissions;
exports.installSdk = installSdk;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const crypto = __importStar(require("crypto"));
const utils_1 = require("./utils");
const version_1 = require("./version");
/**
 * Get the download URL and checksum for a specific version and platform from manifest
 * Falls back to compatible platform if not found (e.g., linux-x64 -> linux-x86)
 */
async function getDownloadUrl(version, platform, owner, repo) {
    const manifest = await (0, version_1.getVersionManifestData)(version, owner, repo);
    let platformInfo = manifest.platforms[platform];
    // Fallback to compatible platform if not found
    if (!platformInfo) {
        const fallback = getFallbackPlatform(platform);
        if (fallback) {
            core.info(`Platform ${platform} not found, falling back to ${fallback}`);
            platformInfo = manifest.platforms[fallback];
        }
    }
    if (!platformInfo) {
        throw new Error(`Platform ${platform} not found in version manifest for ${version}`);
    }
    return {
        url: platformInfo.downloadUrl,
        checksum: platformInfo.sha256
    };
}
/**
 * Get fallback platform for compatibility
 * e.g., linux-x64 -> linux-x86, macos-x64 -> macos-x86
 */
function getFallbackPlatform(platform) {
    const fallbackMap = {
        'linux-x64': 'linux-x86',
        'macos-x64': 'macos-x86'
    };
    return fallbackMap[platform] || null;
}
/**
 * Download the SDK package
 */
async function downloadPackage(version, platform, owner, repo, retries = 3) {
    const downloadInfo = await getDownloadUrl(version, platform, owner, repo);
    const packageName = path.basename(downloadInfo.url);
    core.info(`Downloading ${packageName}...`);
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const downloadPath = await tc.downloadTool(downloadInfo.url);
            core.info(`Downloaded to: ${downloadPath}`);
            return {
                path: downloadPath,
                checksum: downloadInfo.checksum
            };
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < retries) {
                core.warning(`Download attempt ${attempt} failed: ${lastError.message}. Retrying...`);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    throw new Error(`Failed to download SDK for version ${version} after ${retries} attempts. ` +
        `Last error: ${lastError?.message}. ` +
        `Download URL: ${downloadInfo.url}`);
}
/**
 * Verify the downloaded package checksum (SHA256)
 * If checksum is provided in manifest, validates the downloaded file
 * If checksum is not provided, logs a warning and continues
 */
async function verifyPackageChecksum(downloadPath, expectedChecksum) {
    if (!expectedChecksum) {
        core.warning('No checksum provided in manifest, skipping verification');
        return;
    }
    core.info('Verifying package checksum...');
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(downloadPath);
        stream.on('error', error => {
            reject(new Error(`Failed to read file for checksum verification: ${error.message}`));
        });
        stream.on('data', chunk => {
            hash.update(chunk);
        });
        stream.on('end', () => {
            const fileChecksum = hash.digest('hex');
            const expectedLower = expectedChecksum.toLowerCase();
            const fileLower = fileChecksum.toLowerCase();
            if (fileLower === expectedLower) {
                core.info(`Checksum verified: ${fileChecksum}`);
                resolve();
            }
            else {
                reject(new Error(`Checksum verification failed.\n` +
                    `Expected: ${expectedLower}\n` +
                    `Got:      ${fileLower}`));
            }
        });
    });
}
/**
 * Extract the downloaded package directly to final location
 * Uses native unzip command to preserve symlinks
 */
async function extractPackage(downloadPath, platform, extractDir) {
    core.info(`Extracting package to ${extractDir}...`);
    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
    }
    try {
        // Use native unzip command to preserve symlinks on Linux/macOS
        if (process.platform !== 'win32') {
            core.info('Using native unzip command to preserve symlinks...');
            await exec.exec('unzip', ['-q', downloadPath, '-d', extractDir]);
            const extractedPath = extractDir;
            core.info(`Extracted to: ${extractedPath}`);
            return extractedPath;
        }
        else {
            // On Windows, use tool-cache's extractZip
            core.info('Using tool-cache extractZip for Windows...');
            const extractedPath = await tc.extractZip(downloadPath, extractDir);
            core.info(`Extracted to: ${extractedPath}`);
            return extractedPath;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract package: ${message}`);
    }
}
/**
 * Verify the extracted SDK structure
 */
async function verifySdkStructure(commandLineToolsDir) {
    core.info('Verifying SDK structure...');
    const requiredDirs = [
        { path: 'bin', desc: 'bin directory' },
        { path: 'sdk/default/openharmony/toolchains', desc: 'HDC toolchains directory' },
        { path: 'tool/node/bin', desc: 'Node.js bin directory' }
    ];
    const missingDirs = [];
    for (const { path: relPath, desc } of requiredDirs) {
        const fullPath = path.join(commandLineToolsDir, relPath);
        if (!fs.existsSync(fullPath)) {
            missingDirs.push(`${desc} (${relPath})`);
        }
    }
    if (missingDirs.length > 0) {
        throw new Error(`SDK structure verification failed. Missing directories:\n  - ${missingDirs.join('\n  - ')}`);
    }
    core.info('SDK structure verified successfully');
}
/**
 * Set executable permissions on Linux/macOS
 */
async function setExecutablePermissions(commandLineToolsDir) {
    if (process.platform === 'win32') {
        return; // Skip on Windows
    }
    core.info('Setting executable permissions...');
    try {
        // Make scripts in bin directory executable
        const binDir = path.join(commandLineToolsDir, 'bin');
        if (fs.existsSync(binDir)) {
            await exec.exec('chmod', ['-R', '+x', binDir]);
        }
        // Make Node.js executable
        const nodeDir = path.join(commandLineToolsDir, 'tool/node/bin');
        if (fs.existsSync(nodeDir)) {
            await exec.exec('chmod', ['-R', '+x', nodeDir]);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        core.warning(`Failed to set executable permissions: ${message}`);
    }
}
/**
 * Install the SDK
 */
async function installSdk(version, platform, owner, repo) {
    const commandLineToolsDir = (0, utils_1.getCommandLineToolsDir)(version);
    const installBaseDir = (0, utils_1.getInstallBaseDir)();
    // If already installed, return the path
    if (fs.existsSync(commandLineToolsDir)) {
        core.info(`SDK already installed at ${commandLineToolsDir}`);
        return commandLineToolsDir;
    }
    // Download the package
    const downloadResult = await downloadPackage(version, platform, owner, repo);
    const downloadPath = downloadResult.path;
    try {
        // Verify checksum if provided
        await verifyPackageChecksum(downloadPath, downloadResult.checksum);
        // Ensure base directory exists
        const finalDir = path.join(installBaseDir, version);
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        // Extract directly to final location
        // This preserves symlinks on Linux/macOS
        core.info('Extracting SDK package...');
        const extractedPath = await extractPackage(downloadPath, platform, finalDir);
        // Check what was actually extracted
        const extractedContents = fs.readdirSync(extractedPath);
        core.info(`Extracted contents: ${extractedContents.join(', ')}`);
        core.info(`Extracted path: ${extractedPath}`);
        core.info(`Expected final path: ${commandLineToolsDir}`);
        // Handle different extraction scenarios
        // On Windows: tc.extractZip() might return the command-line-tools directory directly
        // On Linux/macOS: unzip might extract to a parent directory with command-line-tools inside
        const possibleNestedDir = path.join(extractedPath, 'command-line-tools');
        const isNestedStructure = fs.existsSync(possibleNestedDir) &&
            possibleNestedDir !== commandLineToolsDir &&
            extractedPath !== commandLineToolsDir;
        if (isNestedStructure) {
            // Case 1: Nested structure - need to flatten
            core.info('Flattening nested command-line-tools directory...');
            // Remove existing directory if it exists
            if (fs.existsSync(commandLineToolsDir)) {
                fs.rmSync(commandLineToolsDir, { recursive: true, force: true });
            }
            // Rename the nested directory to the final location
            fs.renameSync(possibleNestedDir, commandLineToolsDir);
        }
        else if (extractedPath !== commandLineToolsDir && fs.existsSync(extractedPath)) {
            // Case 2: Extracted to a parent directory, but no nested command-line-tools found
            // This might be the direct structure - verify that required directories exist
            core.info('Verifying extraction result...');
            if (!fs.existsSync(commandLineToolsDir)) {
                // Try to use the extracted path as the command-line-tools directory
                core.info(`Using extracted path as command-line-tools directory`);
                // The verification step will check if this is valid
            }
        }
        else if (extractedPath === commandLineToolsDir) {
            // Case 3: Already at the correct location (likely Windows with tc.extractZip)
            core.info('SDK extracted directly to final location');
        }
        else {
            // Case 4: Something unexpected
            core.warning(`Unexpected extraction result`);
            core.warning(`Extracted path: ${extractedPath}`);
            core.warning(`Expected final path: ${commandLineToolsDir}`);
            core.warning(`Available contents: ${extractedContents.join(', ')}`);
        }
        // Verify the structure
        await verifySdkStructure(commandLineToolsDir);
        // Set executable permissions
        await setExecutablePermissions(commandLineToolsDir);
        core.info(`SDK installed successfully at ${commandLineToolsDir}`);
        return commandLineToolsDir;
    }
    catch (error) {
        // Clean up on failure
        fs.rmSync(path.join(installBaseDir, version), { recursive: true, force: true });
        throw error;
    }
}
//# sourceMappingURL=installer.js.map