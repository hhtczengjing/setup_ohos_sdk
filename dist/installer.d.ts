import { Platform } from './utils';
/**
 * Platform info with URL and checksum
 */
interface PlatformDownloadInfo {
    url: string;
    checksum?: string;
}
/**
 * Get the download URL and checksum for a specific version and platform from manifest
 * Falls back to compatible platform if not found (e.g., linux-x64 -> linux-x86)
 */
export declare function getDownloadUrl(version: string, platform: Platform, owner: string, repo: string): Promise<PlatformDownloadInfo>;
/**
 * Download result with path and checksum
 */
interface DownloadResult {
    path: string;
    checksum?: string;
}
/**
 * Download the SDK package
 */
export declare function downloadPackage(version: string, platform: Platform, owner: string, repo: string, retries?: number): Promise<DownloadResult>;
/**
 * Verify the downloaded package checksum (SHA256)
 * If checksum is provided in manifest, validates the downloaded file
 * If checksum is not provided, logs a warning and continues
 */
export declare function verifyPackageChecksum(downloadPath: string, expectedChecksum: string | undefined): Promise<void>;
/**
 * Extract the downloaded package
 * All packages are in .zip format
 */
export declare function extractPackage(downloadPath: string, platform: Platform, extractDir: string): Promise<string>;
/**
 * Verify the extracted SDK structure
 */
export declare function verifySdkStructure(commandLineToolsDir: string): Promise<void>;
/**
 * Set executable permissions on Linux/macOS
 */
export declare function setExecutablePermissions(commandLineToolsDir: string): Promise<void>;
/**
 * Install the SDK
 */
export declare function installSdk(version: string, platform: Platform, owner: string, repo: string): Promise<string>;
export {};
//# sourceMappingURL=installer.d.ts.map