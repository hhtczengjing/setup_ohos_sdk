export interface EnvConfig {
    version: string;
    commandLineToolDir: string;
    hosSdkHome: string;
    hdcHome: string;
    nodeHome: string;
}
/**
 * Create environment configuration for a given version
 */
export declare function createEnvConfig(version: string): EnvConfig;
/**
 * Setup environment variables
 */
export declare function setupEnvironment(config: EnvConfig): void;
/**
 * Set action outputs
 */
export declare function setOutputs(config: EnvConfig): void;
//# sourceMappingURL=environment.d.ts.map