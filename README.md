# Setup HarmonyOS Next SDK

A GitHub Action to set up HarmonyOS Next SDK (command-line tools) in your workflow with automatic version management, multi-platform support, and intelligent caching.

## Features

- ✅ **Version Management**: Specify a version or automatically use the latest
- ✅ **Multi-Platform Support**: Windows (64-bit), Linux (X86), macOS (X86), macOS (ARM)
- ✅ **Intelligent Caching**: Significantly speeds up subsequent runs
- ✅ **Environment Configuration**: Automatically sets up all required environment variables
- ✅ **Easy to Use**: Simple, intuitive API

## Usage

### Basic Usage (Latest Version)

```yaml
name: Build with HarmonyOS Next SDK
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup HarmonyOS Next SDK
        uses: hhtczengjing/setup-ohos-sdk@v1

      - name: Build
        run: |
          echo "SDK Version: ${{ env.COMMANDLINE_TOOLS_VERSION }}"
          echo "SDK Home: ${{ env.HOS_SDK_HOME }}"
```

### Specify Version

```yaml
- name: Setup HarmonyOS Next SDK
  uses: hhtczengjing/setup-ohos-sdk@v1
  with:
    version: '5.0.11.100'
```

### Using Outputs

```yaml
- name: Setup HarmonyOS Next SDK
  id: setup-sdk
  uses: hhtczengjing/setup-ohos-sdk@v1

- name: Verify Installation
  run: |
    echo "Command-line tools: ${{ steps.setup-sdk.outputs.command-line-tools-path }}"
    echo "SDK Home: ${{ steps.setup-sdk.outputs.sdk-home }}"
    echo "HDC Home: ${{ steps.setup-sdk.outputs.hdc-home }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | HarmonyOS Next SDK version (e.g., `5.0.11.100`). If not specified, uses the latest version. | No | (latest) |

## Outputs

| Output | Description |
|--------|-------------|
| `command-line-tools-path` | Path to the command-line tools directory |
| `sdk-home` | Path to HOS_SDK_HOME |
| `hdc-home` | Path to HDC tools directory |

## Environment Variables

The action automatically sets the following environment variables for use in subsequent steps:

```bash
COMMANDLINE_TOOLS_VERSION    # SDK version (e.g., 5.0.11.100)
COMMANDLINE_TOOL_DIR         # Full path to command-line tools
HOS_SDK_HOME                 # SDK directory
HDC_HOME                     # HDC toolchain directory
NODE_HOME                    # Internal Node.js directory
PATH                         # Updated to include SDK binaries
```

## How It Works

1. **Version Resolution**: Uses provided version or fetches the latest from [ohos_command_line_tools](https://github.com/hhtczengjing/ohos_command_line_tools) GitHub Releases
2. **Platform Detection**: Automatically detects your OS and architecture
3. **Cache Check**: Looks for cached SDK from previous runs
4. **Download & Install**: Downloads the SDK package (.zip) if not cached
5. **Environment Setup**: Configures all required environment variables and PATH
6. **Verification**: Verifies the SDK structure and critical files

## Supported Platforms

- Windows 64-bit (x64)
- Linux X86 64-bit (x64)
- macOS Intel (x64)
- macOS Apple Silicon (ARM64)

## Caching

The action automatically caches the SDK after the first installation. This significantly speeds up subsequent workflow runs:

- **Cache Key**: `ohos-sdk-{version}-{platform}`
- **Cache Location**: GitHub Actions tool cache directory

## SDK Source

This action downloads HarmonyOS Next SDK from:
- **Repository**: https://github.com/hhtczengjing/ohos_command_line_tools
- **Package Format**: `.zip` for all platforms
- **Package Naming**: `ohos_command_line_tools-{version}-{platform}.zip`

## Examples

### Matrix Build (Multi-Platform)

```yaml
name: Multi-Platform Build
on: [push]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup HarmonyOS Next SDK
        uses: hhtczengjing/setup-ohos-sdk@v1
        with:
          version: '5.0.11.100'
          version: '5.0.11.100'

      - name: Build App
        run: |
          echo "Building on ${{ runner.os }}"
          # Your build commands here
```

### Version Matrix

```yaml
jobs:
  build:
    strategy:
      matrix:
        sdk-version: ['5.0.11.100', '5.0.10.0']
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup HarmonyOS Next SDK v${{ matrix.sdk-version }}
        uses: hhtczengjing/setup-ohos-sdk@v1
        with:
          version: ${{ matrix.sdk-version }}
```

## Troubleshooting

### "No such file or directory" during download

This typically means the specified version doesn't exist in GitHub Releases. Verify:
- The version format is correct (X.X.X.X)
- The release actually exists on GitHub
- Your internet connection is working

### SDK structure verification failed

If this error occurs, the downloaded SDK package may be corrupted:
- Check the download URL is accessible
- Try deleting the local cache and re-running
- Verify the release contains a valid SDK package

### Platform not supported

This action only supports the platforms listed above. If you need additional platform support, please file an issue.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
