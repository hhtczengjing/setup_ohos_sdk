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
exports.createEnvConfig = createEnvConfig;
exports.setupEnvironment = setupEnvironment;
exports.setOutputs = setOutputs;
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
/**
 * Create environment configuration for a given version
 */
function createEnvConfig(version) {
    return {
        version,
        commandLineToolDir: (0, utils_1.getCommandLineToolsDir)(version),
        hosSdkHome: (0, utils_1.getHosSdkHome)(version),
        hdcHome: (0, utils_1.getHdcHome)(version),
        nodeHome: (0, utils_1.getNodeHome)(version)
    };
}
/**
 * Setup environment variables
 */
function setupEnvironment(config) {
    core.exportVariable('COMMANDLINE_TOOLS_VERSION', config.version);
    core.exportVariable('COMMANDLINE_TOOL_DIR', config.commandLineToolDir);
    core.exportVariable('HOS_SDK_HOME', config.hosSdkHome);
    core.exportVariable('HDC_HOME', config.hdcHome);
    core.exportVariable('NODE_HOME', config.nodeHome);
    // Add to PATH
    core.addPath(`${config.commandLineToolDir}/bin`);
    core.addPath(config.hdcHome);
    core.addPath(`${config.nodeHome}/bin`);
    core.info('Environment variables configured');
}
/**
 * Set action outputs
 */
function setOutputs(config) {
    core.setOutput('command-line-tools-path', config.commandLineToolDir);
    core.setOutput('sdk-home', config.hosSdkHome);
    core.setOutput('hdc-home', config.hdcHome);
    core.info('Outputs set');
}
//# sourceMappingURL=environment.js.map