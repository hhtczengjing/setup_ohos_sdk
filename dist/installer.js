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
 */
async function getDownloadUrl(version, platform, owner, repo) {
    const manifest = await (0, version_1.getVersionManifestData)(version, owner, repo);
    const platformInfo = manifest.platforms[platform];
    if (!platformInfo) {
        throw new Error(`Platform ${platform} not found in version manifest for ${version}`);
    }
    return {
        url: platformInfo.downloadUrl,
        checksum: platformInfo.sha256
    };
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
 * Extract the downloaded package
 * All packages are in .zip format
 */
async function extractPackage(downloadPath, platform, extractDir) {
    core.info(`Extracting package to ${extractDir}...`);
    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
    }
    let extractedPath;
    try {
        // All packages are .zip format
        extractedPath = await tc.extractZip(downloadPath, extractDir);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract package: ${message}`);
    }
    core.info(`Extracted to: ${extractedPath}`);
    return extractedPath;
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
        // Extract to a temporary directory first
        const tempExtractDir = path.join(installBaseDir, version, 'temp');
        const extractedPath = await extractPackage(downloadPath, platform, tempExtractDir);
        // Move extracted content to final location
        // The extracted path might be nested, so we need to handle that
        const finalDir = path.join(installBaseDir, version);
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        // Clean up and move
        const sourceDir = fs.existsSync(path.join(extractedPath, 'command-line-tools'))
            ? path.join(extractedPath, 'command-line-tools')
            : extractedPath;
        // Ensure command-line-tools directory exists
        if (!fs.existsSync(commandLineToolsDir)) {
            fs.mkdirSync(commandLineToolsDir, { recursive: true });
        }
        // Copy files from source to final location
        for (const file of fs.readdirSync(sourceDir)) {
            const srcPath = path.join(sourceDir, file);
            const destPath = path.join(commandLineToolsDir, file);
            if (fs.statSync(srcPath).isDirectory()) {
                // Recursively copy directories
                copyDirSync(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        // Verify the structure
        await verifySdkStructure(commandLineToolsDir);
        // Set executable permissions
        await setExecutablePermissions(commandLineToolsDir);
        // Clean up temp directory
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
        core.info(`SDK installed successfully at ${commandLineToolsDir}`);
        return commandLineToolsDir;
    }
    catch (error) {
        // Clean up on failure
        fs.rmSync(path.join(installBaseDir, version), { recursive: true, force: true });
        throw error;
    }
}
/**
 * Recursively copy directory
 */
function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            copyDirSync(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
//# sourceMappingURL=installer.js.map