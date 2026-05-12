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
exports.getPlatform = getPlatform;
exports.getPackageName = getPackageName;
exports.getInstallBaseDir = getInstallBaseDir;
exports.getCommandLineToolsDir = getCommandLineToolsDir;
exports.getHosSdkHome = getHosSdkHome;
exports.getHdcHome = getHdcHome;
exports.getNodeHome = getNodeHome;
const os = __importStar(require("os"));
/**
 * Detect the current platform
 */
function getPlatform() {
    const platform = process.platform;
    const arch = process.arch;
    if (platform === 'win32') {
        if (arch === 'x64') {
            return 'windows-x64';
        }
        throw new Error(`Unsupported Windows architecture: ${arch}`);
    }
    if (platform === 'linux') {
        if (arch === 'x64') {
            return 'linux-x64';
        }
        throw new Error(`Unsupported Linux architecture: ${arch}`);
    }
    if (platform === 'darwin') {
        if (arch === 'x64') {
            return 'macos-x64';
        }
        if (arch === 'arm64') {
            return 'macos-arm64';
        }
        throw new Error(`Unsupported macOS architecture: ${arch}`);
    }
    throw new Error(`Unsupported platform: ${platform}`);
}
/**
 * Get the install package name based on version and platform
 * Downloads from https://github.com/hhtczengjing/ohos_command_line_tools
 */
function getPackageName(version, platform) {
    // All platforms use .zip format
    return `ohos_command_line_tools-${version}-${platform}.zip`;
}
/**
 * Get the base installation directory
 */
function getInstallBaseDir() {
    return `${os.homedir()}/ohos`;
}
/**
 * Get the command-line tools directory
 */
function getCommandLineToolsDir(version) {
    return `${getInstallBaseDir()}/${version}/command-line-tools`;
}
/**
 * Get the HOS_SDK_HOME directory
 */
function getHosSdkHome(version) {
    return `${getCommandLineToolsDir(version)}/sdk`;
}
/**
 * Get the HDC tools directory
 */
function getHdcHome(version) {
    return `${getHosSdkHome(version)}/default/openharmony/toolchains`;
}
/**
 * Get the NODE_HOME directory (internal use)
 */
function getNodeHome(version) {
    return `${getCommandLineToolsDir(version)}/tool/node`;
}
//# sourceMappingURL=utils.js.map