# @vercel/ncc 方案详细介绍

## 📋 目录
1. [基础概念](#基础概念)
2. [工作原理](#工作原理)
3. [为什么用 ncc](#为什么用-ncc)
4. [ncc vs 其他打包工具](#ncc-vs-其他打包工具)
5. [实际应用案例](#实际应用案例)
6. [安装和使用](#安装和使用)
7. [最佳实践](#最佳实践)

---

## 基础概念

### 什么是 ncc？

**ncc** 是 Vercel 开发的 Node.js 模块编译器，全称 **Node.js Compiler**。

```
ncc = "Compile Node.js projects into single executable files"
```

### 核心作用

ncc 的主要作用是：

1. **将代码和所有依赖打包成单个文件** - 从 `src/index.ts` 到 `dist/index.js`
2. **消除对 node_modules 的依赖** - 不需要提交 315 个依赖包
3. **加速 GitHub Actions 执行** - 单个文件比提取 14,000+ 文件更快

### 简单对比

```yaml
# ❌ 当前方案（你的项目）
├── src/
│   ├── main.ts
│   ├── installer.ts
│   └── ...
├── dist/
│   ├── main.js
│   ├── installer.js
│   ├── node_modules/          ← 157 MB, 14,267 文件
│   │   ├── @actions/core/
│   │   ├── @actions/cache/
│   │   └── ... 315 个包
│   └── ...
└── node_modules/              ← 重复存储

# ✅ ncc 方案
├── src/
│   ├── main.ts
│   ├── installer.ts
│   └── ...
├── dist/
│   └── main.js                ← 单个 2-5 MB 的文件
│                                （包含所有依赖）
└── node_modules/              ← 仅用于开发，不提交
```

---

## 工作原理

### NCC 的编译流程

```
Step 1: 静态分析
┌─────────────────────────────────────┐
│ ncc 读取源文件 (src/main.ts)       │
│ 静态分析所有 require/import 语句   │
│ 构建完整的依赖树                    │
└─────────────────────────────────────┘
                ↓
Step 2: 依赖追踪
┌─────────────────────────────────────┐
│ 追踪 node_modules 中的依赖         │
│ 包括间接依赖（子依赖）              │
│ 生成完整的依赖图                    │
└─────────────────────────────────────┘
                ↓
Step 3: 代码转换
┌─────────────────────────────────────┐
│ TypeScript → JavaScript 转换        │
│ CommonJS 标准化处理                 │
│ 资源文件内联（如需要）              │
└─────────────────────────────────────┘
                ↓
Step 4: 打包和优化
┌─────────────────────────────────────┐
│ 合并所有代码文件                    │
│ 可选：minification（压缩）          │
│ 可选：Source Maps（调试）           │
└─────────────────────────────────────┘
                ↓
Step 5: 输出单个文件
┌─────────────────────────────────────┐
│ dist/main.js                        │
│ + 可选: licenses.txt (许可证)       │
│ + 可选: main.js.map (调试映射)      │
└─────────────────────────────────────┘
```

### 具体例子

假设你的 `src/main.ts` 包含：

```typescript
import * as core from '@actions/core'
import { installSdk } from './installer'

async function run() {
  core.info('Starting installation')
  await installSdk('6.1.0.830', 'windows-x64', 'owner', 'repo')
}
```

**ncc 处理过程：**

1. 发现 import `@actions/core` → 找到 `node_modules/@actions/core/lib/core.js`
2. 发现 import `./installer` → 找到本地的 `dist/installer.js`
3. 继续递归追踪 installer 的依赖...
4. 将所有代码合并成一个文件

**输出 dist/main.js 包含：**

```javascript
// 原始 @actions/core 代码
(function() {
  const core = { info: function() {...}, ... }

  // 原始 installer.ts 的代码
  async function installSdk() {...}

  // 原始 main.ts 的代码
  async function run() {
    core.info('Starting installation')
    await installSdk(...)
  }

  run()
})()
```

---

## 为什么用 ncc

### 1️⃣ 解决 GitHub Actions 的核心限制

GitHub Actions 运行时：
- ❌ 不会自动执行 `npm install`
- ❌ 你需要提供完整的依赖
- ✅ 支持单文件执行

**两种解决方案：**

| 方案 | 大小 | 文件数 | 速度 | 缺点 |
|------|------|--------|------|------|
| 提交 node_modules | 157 MB | 14,267 | 快 (0s) | ⚠️ 仓库巨大 |
| ncc 打包 | 2-5 MB | 1 | 快 (0s) | 无 ✅ |

### 2️⃣ 减小仓库体积

```bash
# 当前状态
$ du -sh .git
2.5 GB              ← 历史中有很多 dist 文件

# ncc 方案
$ du -sh .git
5-10 MB             ← 只有源代码和打包文件

# 改进比例: 250 倍! 🚀
```

### 3️⃣ 加速 CI/CD

```
时间统计 (首次 clone + 执行):

❌ 完整 node_modules:
  - clone: 30-60s (下载 14,267 文件)
  - install: 0s (已提交)
  - total: 30-60s

✅ ncc 方案:
  - clone: <5s (下载单个文件)
  - install: 3-5s (npm install)
  - total: 3-10s

加速: 3-10 倍! 🚀
```

### 4️⃣ 符合行业标准

所有官方 GitHub Actions 都用 ncc：
- ✅ actions/setup-node
- ✅ actions/setup-python
- ✅ actions/setup-dotnet
- ✅ actions/checkout
- ✅ actions/upload-artifact

### 5️⃣ 便于维护和审查

```
PR 审查体验对比:

❌ 当前方案:
  Files changed:  14,267+ ❌ 无法审查
  +++ dist/node_modules/@actions/cache/...
  +++ dist/node_modules/@actions/core/...
  +++ dist/node_modules/@octokit/rest/...
  ... 14,000+ 更多文件

✅ ncc 方案:
  Files changed:  2-3 ✅ 容易审查
  +++ src/installer.ts
  +++ package.json
  +++ dist/main.js (生成)
```

---

## ncc vs 其他打包工具

### 📊 对比表

| 特性 | ncc | webpack | rollup | esbuild |
|------|-----|---------|--------|---------|
| **用途** | 📦 Node.js CLI | 🎨 大型应用 | 📚 库打包 | ⚡ 超快编译 |
| **GitHub Actions** | ✅ 完美 | ⚠️ 过度设计 | ⚠️ 可以 | ⚠️ 新兴 |
| **配置复杂度** | 0️⃣ 零配置 | 🔴 很高 | 🟡 中等 | 🟡 中等 |
| **输出大小** | 2-5 MB | 5-20 MB | 5-15 MB | 2-4 MB |
| **构建速度** | ⚡ 快 | 🐢 慢 | 🐇 较快 | ⚡⚡ 超快 |
| **TypeScript** | ✅ 原生 | ✅ 需插件 | ✅ 需插件 | ✅ 原生 |
| **Binary 支持** | ✅ 有 | ❌ 无 | ❌ 无 | ❌ 无 |
| **周下载量** | 802K | 42M | 90M | 30M |
| **维护者** | Vercel | JS 社区 | Rich Harris | evanw |
| **学习曲线** | ⬇️ 极低 | ⬆️ 陡峭 | ⬇️ 低 | ⬇️ 低 |

### 为什么 ncc 最适合 GitHub Actions？

```
webpack:
  ❌ 为大型 web 应用设计，过度设计
  ❌ 复杂的配置和插件系统
  ❌ 不支持 native binary 打包
  ❌ 更新频繁，可能破坏兼容性

rollup:
  ✅ 轻量级
  ✅ 专注 ES6 模块
  ❌ 对 Node.js 的一些特性支持不完善
  ❌ 不够专业化

esbuild:
  ✅ 超级快
  ✅ 用 Go 写的
  ❌ 相对较新
  ❌ 对 native binary 支持可能有问题
  ❌ 不是首选 GitHub Actions 工具

ncc:
  ✅ Vercel 专门为 GitHub Actions 设计
  ✅ 零配置开箱即用
  ✅ 完美支持 Node.js 特性和 binary
  ✅ 被官方 GitHub Actions 选择
  ✅ 专注于该领域，不过度设计
  ✅ 最佳实践已得到验证
```

---

## 实际应用案例

### 案例 1: actions/setup-node

**项目结构:**
```
setup-node/
├── src/
│   ├── setup-node.ts        (主入口)
│   └── cache-save.ts        (缓存入口)
├── package.json
├── dist/
│   ├── setup/
│   │   └── index.js         (ncc 打包输出)
│   └── cache-save/
│       └── index.js         (ncc 打包输出)
└── action.yml
```

**package.json:**
```json
{
  "scripts": {
    "build": "ncc build -o dist/setup src/setup-node.ts && ncc build -o dist/cache-save src/cache-save.ts"
  },
  "devDependencies": {
    "@vercel/ncc": "^0.38.3"
  }
}
```

**action.yml:**
```yaml
runs:
  using: 'node20'
  main: 'dist/setup/index.js'     # 指向 ncc 输出
```

**数据:**
- 原始 node_modules: 300+ MB
- ncc 打包后: 3.2 MB
- Git 仓库大小: 4 MB (包括历史)
- Clone 时间: <5 秒

### 案例 2: actions/checkout

类似的配置，但单个打包文件：
```
├── dist/
│   └── index.js            (唯一的 ncc 输出，5.1 MB)
└── action.yml
  runs:
    main: 'dist/index.js'
```

---

## 安装和使用

### Step 1: 安装 ncc

```bash
npm install --save-dev @vercel/ncc@latest
```

### Step 2: 配置 package.json

```json
{
  "scripts": {
    "build": "tsc",
    "package": "ncc build dist/main.js -o dist-ncc",
    "prepare": "npm run build && npm run package"
  },
  "devDependencies": {
    "@vercel/ncc": "^0.38.1",
    "typescript": "^5.4.5"
  }
}
```

**脚本说明:**
- `build`: 编译 TypeScript → JavaScript
- `package`: 用 ncc 打包 `dist/main.js` → `dist-ncc/index.js`
- `prepare`: npm hooks，自动执行 build + package

### Step 3: 更新 action.yml

```yaml
name: 'Setup HarmonyOS Next SDK'
description: 'Set up HarmonyOS Next command-line tools'

inputs:
  version:
    description: 'SDK version (e.g., 6.1.0.830)'
    required: false
    default: ''

outputs:
  command-line-tools-path:
    description: 'Path to command-line tools'
  sdk-home:
    description: 'Path to HOS_SDK_HOME'
  hdc-home:
    description: 'Path to HDC tools'

runs:
  using: 'node20'
  main: 'dist-ncc/index.js'      # ← 改为 ncc 输出位置
```

### Step 4: 更新 .gitignore

```gitignore
# 源代码编译输出
lib/
dist/

# Node 依赖 - 不再提交!
node_modules/

# 可选: 保留 dist-ncc 以外的构建物
# dist-ncc/ 仍然提交 (ncc 输出)

# 其他常见的
*.log
.DS_Store
.env
.env.local
coverage/
.nyc_output/
licenses.txt
```

### Step 5: 构建和提交

```bash
# 本地构建
npm run build      # tsc
npm run package    # ncc

# 或一步到位
npm run prepare    # 自动执行 build + package

# 查看输出
ls -lh dist-ncc/
# dist-ncc/index.js   2.5M
# dist-ncc/licenses.txt  45K

# 提交
git add src/ package.json package-lock.json dist-ncc/ action.yml
git commit -m "build: switch to ncc bundling for distribution"
git push
```

### Step 6: 验证

```bash
# 检查输出大小
du -sh dist-ncc/
# 2.5M ✓

# 检查文件数
find dist-ncc -type f | wc -l
# 2 ✓ (index.js 和 licenses.txt)

# 测试 GitHub Actions 执行
git push
# → 在 GitHub Actions 中运行 workflow
```

---

## 最佳实践

### 1️⃣ 开发工作流

```bash
# 修改源代码
vim src/installer.ts

# 编译 + 打包（一步完成）
npm run prepare

# 提交更改
git add -A
git commit -m "feat: add retry logic for downloads"
git push

# CI/CD 自动验证
# ✓ 测试通过
# ✓ Action 可执行
```

### 2️⃣ 版本管理

使用语义化版本控制：

```bash
# 版本 1.0.0
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions marketplace 使用
# uses: hhtczengjing/setup-ohos-sdk@v1.0.0
# uses: hhtczengjing/setup-ohos-sdk@v1      # 最新 1.x
# uses: hhtczengjing/setup-ohos-sdk@main    # 最新代码
```

### 3️⃣ 许可证处理

ncc 自动收集依赖的许可证：

```bash
ncc build dist/main.js -o dist-ncc --license licenses.txt

# 输出：dist-ncc/licenses.txt
# 内容：所有依赖的许可证摘要
```

### 4️⃣ Source Maps（可选）

为生产环境启用调试：

```json
{
  "scripts": {
    "package": "ncc build dist/main.js -o dist-ncc --source-map"
  }
}
```

输出：
```
dist-ncc/
├── index.js
├── index.js.map        # ← 调试映射文件
└── licenses.txt
```

### 5️⃣ 缓存优化

利用 npm 缓存加速构建：

```json
{
  "scripts": {
    "package": "ncc build dist/main.js -o dist-ncc --cache"
  }
}
```

### 6️⃣ 自动化发布

使用 semantic-release 自动处理版本和发布：

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build and package
        run: npm run prepare

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 7️⃣ 监控包大小

```bash
# 添加到 package.json
{
  "scripts": {
    "check-size": "du -h dist-ncc/index.js"
  }
}

# 目标：保持 < 5 MB
```

---

## 常见问题 (FAQ)

### Q: ncc 支持动态 require 吗？

**A:** 有限支持。ncc 使用静态分析，所以：

```typescript
// ✅ 支持 - 静态可分析
const installer = require('./installer')
import { installSdk } from './installer'

// ❌ 不支持 - 动态计算的路径
const moduleName = 'installer'
const installer = require(`./${moduleName}`)
```

**解决方案:** 在代码中明确指定所有可能的模块。

### Q: 二进制依赖（native modules）如何处理？

**A:** ncc 支持打包二进制文件，但有限制：

```typescript
// ✅ 支持
import * as unzip from 'unzipper'  // npm 包中的 binary

// ⚠️ 需要特殊处理
const exec = require('child_process').exec
// 需要运行时存在系统命令
```

对于你的项目，`unzip` 命令是系统级的，ncc 不打包它，但 GitHub Actions 中已有可用。

### Q: 如何调试 ncc 输出的文件？

**A:** 启用 source maps：

```bash
ncc build dist/main.js -o dist-ncc --source-map

# 在调试工具中使用 .map 文件
```

### Q: 如何减小 ncc 输出的大小？

**A:** 几个选项：

```bash
# 1. 启用 minification
ncc build dist/main.js -o dist-ncc --minify

# 2. 移除源代码（谨慎使用）
# 编辑 ncc 配置...

# 3. 移除不必要的依赖
npm prune --production
```

### Q: ncc 有缓存问题吗？

**A:** 可能性小，但可以清理：

```bash
# 清理 ncc 缓存
rm -rf .ncc_cache

# 完整重建
npm run package
```

### Q: 如何处理 npm 脚本中的符号链接？

**A:** ncc 会保留符号链接，但需要注意：

```typescript
// 你的情况：npm bin 脚本中的符号链接
// ✅ ncc 正确处理
// 提取的 npm 脚本保留符号链接
```

---

## 迁移检查清单

如果决定从当前方案迁移到 ncc，使用此清单：

- [ ] 安装 @vercel/ncc
- [ ] 修改 package.json 脚本
- [ ] 本地测试：`npm run prepare`
- [ ] 验证 dist-ncc/index.js 存在
- [ ] 更新 action.yml 指向新的入口
- [ ] 更新 .gitignore (不提交 dist/ 和 node_modules/)
- [ ] 运行测试确保功能正常
- [ ] 本地提交 + 推送
- [ ] 在 GitHub Actions 中测试 workflow
- [ ] 验证输出大小 (目标: < 5 MB)
- [ ] 发布新版本

---

## 总结

| 指标 | 当前方案 | ncc 方案 |
|------|---------|---------|
| **Dist 大小** | 157 MB | 2-5 MB |
| **Git 文件数** | 14,267 | <50 |
| **提交 node_modules** | ✅ 是 | ❌ 否 |
| **Clone 时间** | 30-60s | <5s |
| **符合标准** | ❌ 否 | ✅ 是 |
| **配置复杂度** | 低 | 极低 |
| **维护成本** | 高 | 低 |
| **PR 审查** | 困难 | 容易 |

---

## 参考资源

- [GitHub - vercel/ncc](https://github.com/vercel/ncc)
- [Creating a JavaScript Action - GitHub Docs](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [GitHub - actions/setup-node](https://github.com/actions/setup-node)
- [A complete guide to use dependabot with semantic-release and @vercel/ncc](https://dev.to/kengotoda/a-complete-guide-to-use-dependabot-with-semantic-release-and-vercel-ncc-for-github-actions-230p)
