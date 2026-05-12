/**
 * Platform information in the version manifest
 */
export interface PlatformInfo {
    url: string;
    filename: string;
    checksum?: string;
}
/**
 * Version manifest structure
 */
export interface VersionManifest {
    version: string;
    platforms: {
        'windows-x64': PlatformInfo;
        'linux-x64': PlatformInfo;
        'macos-x64': PlatformInfo;
        'macos-arm64': PlatformInfo;
    };
}
/**
 * Get version manifest from ohos_command_line_tools repository
 * Tries direct URL first, falls back to GitHub API
 */
export declare function getVersionManifest(version: string, owner: string, repo: string): Promise<VersionManifest>;
/**
 * Get latest version number from VERSION file
 * Tries direct URL first, falls back to GitHub API
 */
export declare function getLatestVersionNumber(owner: string, repo: string): Promise<string>;
/**
 * Resolve version manifest
 * If inputVersion is provided, tries to fetch that version's manifest
 * If not provided or not found, fetches the latest version's manifest
 */
export declare function resolveVersionManifest(inputVersion: string | undefined, owner: string, repo: string): Promise<VersionManifest>;
//# sourceMappingURL=manifest.d.ts.map