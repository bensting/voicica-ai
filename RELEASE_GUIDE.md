# Android 发布指南

本文档介绍如何构建和发布 Android 应用到 GitHub Releases 和 Google Play。

---

## 📋 发布渠道概览

| 渠道 | 用途 | 审核时间 | 命令 |
|------|------|----------|------|
| **GitHub Releases** | 直接分发 APK | 即时 | `npm run release:github` |
| **Google Play (内部)** | 内部测试 | 几分钟 | `npm run android:publish:internal` |
| **Google Play (Beta)** | 公开测试 | 几小时 | `npm run android:publish:beta` |
| **Google Play (生产)** | 正式发布 | 2-7 天 | `npm run android:publish` |

---

## 🚀 快速发布流程

### 完整发布（推荐）

```bash
# 1. 更新版本号
# 编辑 native-version.json

# 2. 同步版本号到 Android
npm run native:version:sync

# 3. 构建 APK
npm run android:build

# 4. 发布到 GitHub Releases
npm run release:github

# 5. 构建 AAB 并发布到 Google Play（可选）
npm run android:build:aab
npm run android:publish:internal
```

### 仅更新 GitHub Release

```bash
npm run android:build
npm run release:github
```

### 仅更新 Google Play

```bash
npm run android:build:aab
npm run android:publish:internal  # 或 android:publish
```

---

## 📦 版本号管理

### 版本文件位置

```
native-version.json    ← 原生应用版本（Android/iOS）
package.json           ← Web 版本
```

### 更新版本号

编辑 `native-version.json`：

```json
{
  "version": "1.0.1",        // 显示给用户的版本
  "buildNumber": 2,          // 构建号（必须递增！）
  "changelog": [
    "修复登录问题",
    "优化性能"
  ]
}
```

**重要规则**：
- `buildNumber` **必须递增**，Google Play 不接受相同或更小的值
- `changelog` 会自动用于生成 Release Notes

### 同步版本号

```bash
npm run native:version:sync
```

这会自动更新：
- `android/app/build.gradle` (versionName, versionCode)
- `ios/App/App.xcodeproj/project.pbxproj` (如果有 iOS)

---

## 📱 GitHub Releases

### 发布命令

```bash
# 正式发布
npm run release:github

# 草稿发布（不公开，可以后续编辑）
npm run release:github:draft

# 测试版本发布（自动 prerelease）
npm run release:github:test
```

### 测试版本发布

用于发布指向测试服务器的 APK，会自动标记为 Pre-release。

**完整流程**：

```bash
# 1. 构建测试包
npm run android:build:test

# 2. 发布到 GitHub（自动标记为 prerelease）
npm run release:github:test
```

**支持的测试环境**：

| 环境名 | 服务器地址 | Release Tag |
|--------|-----------|-------------|
| `test` | https://ai-voice-labs.com | `v1.0.0-test` |
| `staging` | https://staging.voicica.ai | `v1.0.0-staging` |

**特性**：
- 自动查找对应环境的测试 APK
- 自动生成测试版专用 Release Notes
- 自动添加 `--prerelease` 标记
- Tag 格式: `v{version}-{environment}`

### 脚本功能

`scripts/create-github-release.js` 自动完成：

1. ✅ 检查 GitHub CLI 和登录状态
2. ✅ 读取 `native-version.json` 版本信息
3. ✅ 检查 APK 文件是否存在
4. ✅ 计算 SHA256 校验和
5. ✅ 生成 Release Notes（包含版本、大小、安装说明）
6. ✅ 创建 GitHub Release 并上传 APK
7. ✅ 保存发布记录到 `.releases.json`

### 手动操作

```bash
# 查看所有 releases
gh release list

# 查看某个 release 详情
gh release view v1.0.0

# 删除 release（重新发布时需要）
gh release delete v1.0.0 --yes

# 给现有 release 上传额外文件
gh release upload v1.0.0 "path/to/file.apk"

# 编辑 release 信息
gh release edit v1.0.0 --title "新标题" --notes "新说明"
```

### Release Notes 格式

脚本自动生成的 Release Notes 包含：

```markdown
## 📱 Voicica AI v1.0.0

### ✨ 更新内容
- 从 changelog 自动读取

### 📦 下载信息
- 文件名、大小、版本、日期

### 🔐 安全校验
- SHA256 校验和

### 📥 安装说明
- 详细安装步骤
```

---

## 🏪 Google Play

### 前提条件

1. ✅ Google Play Developer 账号（$25）
2. ✅ 服务账号 JSON 文件（见 `GOOGLE_PLAY_SETUP.md`）
3. ✅ 应用已在 Google Play Console 创建

### 发布命令

```bash
# 构建 AAB
npm run android:build:aab

# 发布到不同轨道
npm run android:publish:internal   # 内部测试
npm run android:publish:beta       # Beta 测试
npm run android:publish            # 生产环境
```

### 首次发布

首次发布需要在 Google Play Console 网页上手动完成：

1. 创建应用
2. 填写商店详情（名称、描述、截图等）
3. 完成内容分级问卷
4. 填写数据安全表单
5. 上传首个 AAB

详细步骤见 `GOOGLE_PLAY_SETUP.md`。

---

## 🔧 构建命令参考

### Android 构建

```bash
# 构建签名 APK（用于直接分发）
npm run android:build

# 构建签名 AAB（用于 Google Play）
npm run android:build:aab

# 构建测试包（指定不同的服务器 URL）
npm run android:build:test <url|环境名>

# 构建调试版本
npm run android:build:debug

# 清理构建缓存
npm run android:clean
```

### 构建输出位置

```
APK: android/app/build/outputs/apk/release/app-release.apk
AAB: android/app/build/outputs/bundle/release/app-release.aab
测试包: android/app/build/outputs/apk/release/app-release-{环境}-v{版本}.apk
```

---

## 🧪 测试包构建

用于构建指向不同服务器 URL 的测试 APK。

### 预设环境

| 环境名 | URL |
|--------|-----|
| `test` | https://ai-voice-labs.com |
| `staging` | https://staging.voicica.ai |
| `production` | https://voicica.ai/studio |

### 使用方法

```bash
# 使用预设环境名
npm run android:build:test test
npm run android:build:test staging
npm run android:build:test production

# 使用自定义 URL
npm run android:build:test https://ai-voice-labs.com
npm run android:build:test https://your-custom-domain.com
```

### 输出文件

测试包会生成带环境标识的文件名：

```
app-release-ai-voice-labs-v1.0.0.apk
app-release-staging-v1.0.0.apk
app-release-production-v1.0.0.apk
```

同时生成构建信息文件：

```json
// build-info-ai-voice-labs.json
{
  "type": "test",
  "environment": "ai-voice-labs",
  "serverUrl": "https://ai-voice-labs.com",
  "version": "1.0.0",
  "buildNumber": 1,
  "buildDate": "2025-12-03T..."
}
```

### 注意事项

- 测试包和正式包使用相同的签名密钥
- 测试包会同时保留原始的 `app-release.apk`
- `allowNavigation` 会根据 URL 自动配置正确的域名

---

## 📊 发布检查清单

### 发布前检查

```
□ 功能测试通过
□ 版本号已更新（native-version.json）
□ changelog 已填写
□ 版本号已同步（npm run native:version:sync）
□ APK/AAB 已构建
□ 在真机上测试过
```

### GitHub Release 检查

```
□ GitHub CLI 已安装并登录
□ APK 文件存在
□ 版本 tag 未被使用
```

### Google Play 检查

```
□ 服务账号 JSON 文件存在
□ AAB 文件存在
□ buildNumber 比上一版本大
```

---

## 🔄 版本演进示例

```
v1.0.0 (Build 1)   ← 首次发布
    ↓
v1.0.1 (Build 2)   ← Bug 修复
    ↓
v1.1.0 (Build 3)   ← 新功能
    ↓
v2.0.0 (Build 4)   ← 重大更新
```

每次发布：
1. 修改 `native-version.json` 中的 version 和 buildNumber
2. 运行构建和发布命令

---

## 🚨 常见问题

### Q: Release tag 已存在

```bash
# 删除现有 release
gh release delete v1.0.0 --yes

# 重新发布
npm run release:github
```

### Q: APK 文件不存在

```bash
# 先构建 APK
npm run android:build
```

### Q: GitHub CLI 未登录

```bash
# 登录 GitHub
gh auth login
```

### Q: Google Play 上传失败

1. 检查服务账号 JSON 文件是否存在
2. 检查 buildNumber 是否递增
3. 检查服务账号权限是否正确

---

## 📁 相关文件

```
scripts/
├── build-android.js           # Android 构建脚本
├── upload-to-google-play.js   # Google Play 上传脚本
├── sync-native-version.js     # 版本同步脚本
└── sync-version.js            # Web 版本同步脚本

docs/
├── RELEASE_GUIDE.md           # 本文档
├── GOOGLE_PLAY_SETUP.md       # Google Play 配置指南
└── NATIVE_APPS.md             # 原生应用文档
```

---

## 💡 最佳实践

1. **先发布到 GitHub Releases**，让用户可以直接下载测试
2. **再发布到 Google Play 内部测试**，团队验证
3. **最后发布到 Google Play 生产环境**
4. **保持 changelog 更新**，方便生成 Release Notes
5. **定期检查 .releases.json**，跟踪发布历史

---

最后更新：2025-12-03