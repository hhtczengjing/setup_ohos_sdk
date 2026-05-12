import { VersionManifest } from './manifest';
/**
 * Validate version format
 */
export declare function isValidVersion(version: string): boolean;
/**
 * Compare two versions
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export declare function compareVersions(v1: string, v2: string): number;
/**
 * Get the latest version from VERSION file in ohos_command_line_tools repository
 */
export declare function getLatestVersion(owner: string, repo: string): Promise<string>;
/**
 * Resolve version - use provided version or fetch latest
 */
export declare function resolveVersion(inputVersion: string, owner: string, repo: string): Promise<string>;
/**
 * Get version manifest (platform information and download URLs)
 */
export declare function getVersionManifestData(version: string, owner: string, repo: string): Promise<VersionManifest>;
//# sourceMappingURL=version.d.ts.map