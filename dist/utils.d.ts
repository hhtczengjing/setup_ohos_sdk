export type Platform = 'windows-x64' | 'linux-x64' | 'macos-x64' | 'macos-arm64';
/**
 * Detect the current platform
 */
export declare function getPlatform(): Platform;
/**
 * Get the base installation directory
 */
export declare function getInstallBaseDir(): string;
/**
 * Get the command-line tools directory
 */
export declare function getCommandLineToolsDir(version: string): string;
/**
 * Get the HOS_SDK_HOME directory
 */
export declare function getHosSdkHome(version: string): string;
/**
 * Get the HDC tools directory
 */
export declare function getHdcHome(version: string): string;
/**
 * Get the NODE_HOME directory (internal use)
 */
export declare function getNodeHome(version: string): string;
//# sourceMappingURL=utils.d.ts.map