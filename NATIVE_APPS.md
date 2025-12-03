# 原生应用开发指南 (Android & iOS)

> 本文档介绍如何使用 Capacitor 构建、发布和管理 Android/iOS 原生应用

## 📱 项目概述

本项目使用 **Capacitor 7** 将 Next.js Web 应用打包为原生 Android 和 iOS 应用。

### 架构模式：WebView 远程加载

```
原生应用壳 (Android/iOS)
    ↓ 加载
https://voicica.ai (生产环境)
```

**特点**：
- ✅ Web 内容可热更新，无需重新发布应用
- ✅ 用户始终使用最新功能
- ⚠️  需要网络连接才能使用
- ⚠️  原生功能变化时需要更新 APK/IPA

---

## 🔄 双版本管理机制

### Web 版本（频繁更新）

**版本源**：`package.json`
**更新频率**：每次发布（可能每天/每周）
**影响范围**：PWA、网页内容、应用内显示的版本号

```bash
# 更新 Web 版本
npm run version:patch   # 0.1.1 -> 0.1.2
npm run version:minor   # 0.1.1 -> 0.2.0
npm run version:major   # 0.1.1 -> 1.0.0

# 部署到 Vercel，用户刷新即可看到更新
vercel --prod
```

### 原生应用版本（偶尔更新）

**版本源**：`native-version.json`
**更新频率**：原生功能变化时（可能几个月一次）
**影响范围**：Android APK/AAB、iOS IPA

```bash
# 1. 手动编辑 native-version.json
{
  "version": "1.0.0",
  "buildNumber": 1
}

# 2. 同步到 Android 和 iOS
npm run native:version:sync

# 3. 构建原生应用
# Android: ./gradlew assembleRelease
# iOS: Xcode -> Product -> Archive
```

---

## 🛠️ 环境配置

### 必需工具

#### Android 开发
- **Node.js** 18+
- **Android Studio** (最新版)
- **Java JDK** 17+
- **Android SDK** (API 33+)
- **Gradle** 8+

#### iOS 开发
- **macOS** (必需)
- **Xcode** 15+
- **CocoaPods** (`sudo gem install cocoapods`)
- **Apple Developer Account** (付费，$99/年)

### 安装 Capacitor CLI

```bash
npm install -g @capacitor/cli
```

### 初始化原生项目（仅首次）

```bash
# 已在项目中配置，通常不需要再次运行
npx cap add android
npx cap add ios
```

---

## 📦 构建流程

### Android 构建

#### 1. 同步 Web 资源到原生项目

```bash
# 方式 1: 使用项目脚本（推荐）
npm run cap:sync

# 方式 2: 直接使用 Capacitor
npx cap sync android
```

#### 2. 打开 Android Studio

```bash
npm run cap:open:android
```

#### 3. 生成签名密钥（首次）

```bash
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

**重要**：妥善保管密钥文件，丢失后无法更新应用！

#### 4. 配置签名

编辑 `android/app/build.gradle`：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../my-release-key.keystore")
            storePassword "your_password"
            keyAlias "my-key-alias"
            keyPassword "your_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**安全提示**：不要将密钥和密码提交到 Git！

#### 5. 构建 APK/AAB

```bash
cd android

# 构建 APK（直接分发）
./gradlew assembleRelease
# 输出: android/app/build/outputs/apk/release/app-release.apk

# 构建 AAB（Google Play）
./gradlew bundleRelease
# 输出: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS 构建

#### 1. 同步 Web 资源

```bash
npx cap sync ios
```

#### 2. 安装依赖

```bash
cd ios/App
pod install
cd ../..
```

#### 3. 打开 Xcode

```bash
npm run cap:open:ios
```

#### 4. 配置签名和证书

1. 选择项目 → 选择 Target "App"
2. Signing & Capabilities
3. 选择 Team（需要 Apple Developer Account）
4. Bundle Identifier: `ai.voicica.app`

#### 5. 构建

- **开发版本**：Product → Run (⌘R)
- **发布版本**：Product → Archive
  - Archive 完成后 → Distribute App
  - 选择发布方式（App Store / Ad Hoc / Enterprise）

---

## 🚀 发布流程

### Google Play 发布（Android）

#### 首次发布

1. 访问 [Google Play Console](https://play.google.com/console)
2. 创建应用
3. 填写商店信息：
   - 应用名称、描述、截图
   - 内容分级
   - 隐私政策链接
4. 上传 AAB 文件
5. 提交审核（通常 1-3 天）

#### 后续更新

```bash
# 1. 更新原生版本号（如果需要）
# 编辑 native-version.json，增加 buildNumber
npm run native:version:sync

# 2. 构建新版本
cd android && ./gradlew bundleRelease

# 3. 上传到 Google Play Console
# Production → Create new release → Upload AAB
```

**注意**：`versionCode` 必须递增，Google Play 才会接受新版本。

### App Store 发布（iOS）

#### 准备工作

1. Apple Developer Account（$99/年）
2. App Store Connect 中创建应用
3. 配置 App ID、证书、Provisioning Profile

#### 发布步骤

1. Xcode → Product → Archive
2. Organizer → Distribute App
3. 选择 "App Store Connect"
4. 上传构建版本
5. 在 App Store Connect 中：
   - 选择构建版本
   - 填写发布信息
   - 提交审核（通常 1-7 天）

---

## 📂 直接 APK 分发

### 优点
- 无需 Google Play 审核
- 中国大陆用户可下载
- 内部测试快速迭代

### 发布流程

#### 1. 构建签名 APK

```bash
cd android
./gradlew assembleRelease
```

#### 2. 托管 APK

**推荐方式**：

- **GitHub Releases**（免费，可靠）
  ```bash
  # 创建 Release 并上传 APK
  gh release create v1.0.0 android/app/build/outputs/apk/release/app-release.apk
  ```

- **自有服务器**（通过 HTTPS 提供下载）
  ```
  https://yourdomain.com/downloads/voicica-1.0.0.apk
  ```

#### 3. 提供 SHA-256 校验和

```bash
shasum -a 256 app-release.apk
```

在下载页面显示校验和，防止被篡改。

#### 4. 用户安装说明

```markdown
1. 下载 APK 文件
2. 设置 → 安全 → 允许安装未知来源应用
3. 打开 APK 文件进行安装
```

---

## 🔍 版本号规范

### Android

```
versionName: "1.0.0"  (显示给用户)
versionCode: 1        (内部版本号，必须递增)
```

**规则**：
- `versionName` 使用语义化版本号 (major.minor.patch)
- `versionCode` 整数，每次发布必须 +1
- 公式：`buildNumber` 或 `major × 10000 + minor × 100 + patch`

### iOS

```
MARKETING_VERSION: "1.0.0"       (CFBundleShortVersionString)
CURRENT_PROJECT_VERSION: "1"     (CFBundleVersion)
```

**规则**：
- `MARKETING_VERSION` 显示给用户
- `CURRENT_PROJECT_VERSION` 构建号，每次提交必须递增

---

## 🔄 更新策略

### 何时需要更新 APK/IPA？

#### ✅ 需要更新原生应用

- 升级 Capacitor 版本
- 添加/删除原生插件（如相机、地理定位）
- 修改应用权限（AndroidManifest.xml / Info.plist）
- 更换应用图标、启动画面
- 修改应用配置（包名、Bundle ID、Deep Links）
- 修改原生代码（Java/Kotlin/Swift/Objective-C）
- 更新最低 Android/iOS 版本要求

#### ❌ 无需更新原生应用

- 修改 UI/样式
- 更新业务逻辑
- 新增/修改 API 接口
- 修改文案内容
- 新增/修改功能页面
- 修复 Web 端 Bug

### 实际操作流程

#### 日常 Web 更新（无需重新打包）

```bash
# 1. 修改代码
# 2. 更新 Web 版本号
npm run version:patch

# 3. 部署到生产环境
vercel --prod

# ✅ 用户刷新应用即可看到更新
```

#### 原生功能更新（需要重新打包）

```bash
# 1. 修改原生代码/配置
# 2. 更新原生版本号
# 编辑 native-version.json
{
  "version": "1.1.0",
  "buildNumber": 2
}

# 3. 同步版本号
npm run native:version:sync

# 4. 同步到原生项目
npx cap sync

# 5. 构建并发布
# Android: ./gradlew assembleRelease
# iOS: Xcode Archive
```

---

## 📊 版本号示例

### 场景 1: 频繁 Web 更新

```
时间线：
Day 1:  Web 0.1.0 | Native 1.0.0 (Build 1)
Day 3:  Web 0.1.1 | Native 1.0.0 (Build 1) ← Web 更新，APK 不变
Day 5:  Web 0.1.2 | Native 1.0.0 (Build 1) ← Web 更新，APK 不变
Day 7:  Web 0.2.0 | Native 1.0.0 (Build 1) ← Web 更新，APK 不变
```

### 场景 2: 原生功能更新

```
时间线：
Month 1: Web 0.5.0 | Native 1.0.0 (Build 1)
Month 2: Web 0.8.0 | Native 1.0.0 (Build 1)
Month 3: Web 1.0.0 | Native 1.1.0 (Build 2) ← 添加了新插件，需要发布新 APK
```

---

## 🔐 安全最佳实践

### 1. 密钥管理

```bash
# ❌ 错误：将密钥提交到 Git
git add my-release-key.keystore

# ✅ 正确：添加到 .gitignore
echo "*.keystore" >> .gitignore
echo "*.jks" >> .gitignore
```

### 2. 环境变量

```bash
# 使用环境变量存储敏感信息
# .env.local (不提交到 Git)
ANDROID_STORE_PASSWORD=your_password
ANDROID_KEY_PASSWORD=your_password
```

### 3. 代码混淆

编辑 `android/app/build.gradle`：

```gradle
buildTypes {
    release {
        minifyEnabled true  // 启用代码混淆
        shrinkResources true
    }
}
```

---

## 🐛 常见问题

### Android

#### Q1: Build 失败 - "SDK location not found"

```bash
# 创建 android/local.properties
sdk.dir=/Users/YourName/Library/Android/sdk  # macOS
# 或
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk  # Windows
```

#### Q2: 签名验证失败

```
检查：
1. keystore 文件路径是否正确
2. 密码是否正确
3. keyAlias 是否匹配
```

#### Q3: Google Play 拒绝上传 - "versionCode 已存在"

```bash
# 增加 buildNumber
# 编辑 native-version.json
{
  "buildNumber": 2  // 必须大于上一个版本
}

npm run native:version:sync
```

### iOS

#### Q4: 证书问题 - "No signing certificate"

```
解决步骤：
1. Xcode → Preferences → Accounts
2. 添加 Apple ID
3. Download Manual Profiles
4. 项目设置 → Signing → 选择 Team
```

#### Q5: CocoaPods 安装失败

```bash
# 清理并重新安装
cd ios/App
pod deintegrate
pod install
```

---

## 📝 快速参考

### 常用命令

```bash
# === Web 版本管理 ===
npm run version:patch              # 更新 Web 补丁版本
npm run version:minor              # 更新 Web 次版本
npm run version:major              # 更新 Web 主版本

# === 原生版本管理 ===
npm run native:version:show        # 查看当前原生版本
npm run native:version:sync        # 同步原生版本到 Android/iOS

# === Capacitor ===
npx cap sync                       # 同步 Web 资源到原生项目
npx cap sync android               # 仅同步到 Android
npx cap sync ios                   # 仅同步到 iOS
npm run cap:open:android           # 打开 Android Studio
npm run cap:open:ios               # 打开 Xcode

# === 构建 ===
cd android && ./gradlew assembleRelease   # 构建 Android APK
cd android && ./gradlew bundleRelease     # 构建 Android AAB
```

### 文件结构

```
├── package.json                   # Web 版本号
├── native-version.json            # 原生版本号
├── scripts/
│   ├── sync-version.js           # Web 版本同步脚本
│   └── sync-native-version.js    # 原生版本同步脚本
├── android/
│   └── app/
│       └── build.gradle          # Android 配置
├── ios/
│   └── App/
│       └── App.xcodeproj/
│           └── project.pbxproj   # iOS 配置
└── capacitor.config.ts            # Capacitor 配置
```

---

## 📚 相关资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发者指南](https://developer.android.com)
- [iOS 开发者指南](https://developer.apple.com/ios)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

**最后更新**: 2024-12-03
**维护者**: 开发团队