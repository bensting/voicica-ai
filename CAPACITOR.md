# Capacitor 移动应用打包指南

> 本文档介绍如何使用 Capacitor 将 Voicica AI 网站打包成原生移动应用。

## 概述

本项目使用 **Capacitor** 将 Next.js 网站通过 WebView 封装成原生 iOS 和 Android 应用。采用**远程模式（Remote Mode）**，应用启动后直接加载线上网站，实现热更新无需重新发布应用。

### 架构说明

```
┌─────────────────────────────────────┐
│         原生应用 (iOS/Android)        │
│  ┌─────────────────────────────────┐ │
│  │           WebView               │ │
│  │  ┌─────────────────────────────┐│ │
│  │  │   https://voicica.ai        ││ │
│  │  │   (远程网站)                 ││ │
│  │  └─────────────────────────────┘│ │
│  └─────────────────────────────────┘ │
│                                      │
│  原生功能: 状态栏、启动画面、触感反馈   │
└─────────────────────────────────────┘
```

## 目录结构

```
项目根目录/
├── capacitor.config.ts     # Capacitor 配置文件
├── android/                # Android 原生项目
├── ios/                    # iOS 原生项目
├── resources/              # 图标和启动画面源文件
├── scripts/
│   └── generate-app-icons.js  # 图标生成脚本
└── src/
    ├── lib/
    │   └── capacitor.ts    # Capacitor 工具函数
    └── components/
        └── providers/
            └── CapacitorProvider.tsx  # Capacitor 初始化组件
```

## 快速开始

### 前置条件

- **iOS 开发**: macOS + Xcode 15+
- **Android 开发**: Android Studio + JDK 17+
- Node.js 18+

### 初始安装

```bash
# 安装依赖
npm install

# 同步 Capacitor 配置到原生项目
npm run cap:sync
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run cap:sync` | 同步配置和资源到原生项目 |
| `npm run cap:open:ios` | 打开 Xcode 项目 |
| `npm run cap:open:android` | 打开 Android Studio 项目 |
| `npm run cap:run:ios` | 在 iOS 模拟器/设备运行 |
| `npm run cap:run:android` | 在 Android 模拟器/设备运行 |
| `npm run cap:icons` | 从 SVG 生成图标源文件 |
| `npm run cap:assets` | 生成各平台图标 |

## 配置详解

### capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  appId: 'ai.voicica.app',        // 应用包名
  appName: 'Voicica AI',          // 应用名称
  webDir: 'out',                  // Web 资源目录（远程模式下不使用）

  server: {
    // 远程模式：直接加载线上网站
    url: 'https://voicica.ai',
    cleartext: true,
    // 允许导航的域名（OAuth、支付等）
    allowNavigation: [
      '*.voicica.ai',
      '*.stripe.com',
      '*.google.com',
      '*.apple.com',
      '*.twitter.com',
      'accounts.google.com',
    ],
  },

  // 平台特定配置...
};
```

### 关键配置说明

| 配置项 | 说明 |
|--------|------|
| `server.url` | 远程网站地址，应用启动后加载此 URL |
| `allowNavigation` | 允许 WebView 导航的域名白名单 |
| `ios.scheme` | iOS URL Scheme（用于深链接） |
| `android.allowMixedContent` | 允许 HTTPS 页面加载 HTTP 资源 |

## 图标和启动画面

### 生成流程

1. **准备源文件**
   - 确保 `public/icon.svg` 是最新的品牌图标

2. **生成资源文件**
   ```bash
   # 从 SVG 生成 PNG 资源
   npm run cap:icons
   ```

   生成的文件位于 `resources/` 目录：
   - `icon-only.png` (1024x1024) - 主图标
   - `icon-foreground.png` (1024x1024) - Android 自适应图标前景
   - `icon-background.png` (1024x1024) - Android 自适应图标背景
   - `splash.png` (2732x2732) - 启动画面
   - `splash-dark.png` (2732x2732) - 深色启动画面

3. **生成各平台图标**
   ```bash
   npm run cap:assets
   ```

   这会自动生成：
   - Android: `android/app/src/main/res/` 下的各尺寸图标
   - iOS: `ios/App/App/Assets.xcassets/` 下的图标集

4. **同步到原生项目**
   ```bash
   npm run cap:sync
   ```

### 品牌颜色

- 主题色: `#9333ea` (紫色)
- 在以下位置使用：
  - 启动画面背景
  - 状态栏颜色
  - Android 自适应图标背景

## 原生功能

### 已集成的 Capacitor 插件

| 插件 | 用途 |
|------|------|
| `@capacitor/app` | 应用生命周期、返回按钮处理 |
| `@capacitor/splash-screen` | 启动画面控制 |
| `@capacitor/status-bar` | 状态栏样式 |
| `@capacitor/keyboard` | 键盘事件 |
| `@capacitor/haptics` | 触感反馈 |

### 在代码中使用

```typescript
import {
  isNativeApp,
  getPlatform,
  hapticFeedback,
  hideSplashScreen
} from '@/lib/capacitor';

// 检测是否在原生应用中
if (isNativeApp()) {
  // 原生应用特定逻辑
  hapticFeedback('medium');
}

// 获取平台
const platform = getPlatform(); // 'ios' | 'android' | 'web'
```

### CapacitorProvider

`src/components/providers/CapacitorProvider.tsx` 在应用启动时：
1. 初始化 Capacitor
2. 隐藏启动画面
3. 设置状态栏样式
4. 处理 Android 返回按钮

## 开发调试

### iOS 开发

```bash
# 打开 Xcode
npm run cap:open:ios

# 或直接运行
npm run cap:run:ios
```

**注意事项**:
- 需要有效的 Apple 开发者账号
- 真机调试需要配置签名

### Android 开发

```bash
# 打开 Android Studio
npm run cap:open:android

# 或直接运行
npm run cap:run:android
```

**注意事项**:
- 确保安装了 Android SDK 34+
- 模拟器需要 Google Play Services（用于登录）

### 本地调试模式

如需连接本地开发服务器进行调试：

1. 设置环境变量：
   ```bash
   export CAPACITOR_SERVER_URL=http://192.168.x.x:3000
   ```

2. 重新同步：
   ```bash
   npm run cap:sync
   ```

3. 运行应用

**注意**: 本地调试需要设备与电脑在同一网络

## 发布应用

### iOS 发布

1. 在 Xcode 中配置签名和版本号
2. Archive 项目
3. 上传到 App Store Connect
4. 提交审核

### Android 发布

1. 在 Android Studio 中配置签名密钥
2. Build > Generate Signed Bundle/APK
3. 上传到 Google Play Console
4. 提交审核

### 版本号管理

应用版本号需要在原生项目中单独管理：
- **iOS**: `ios/App/App/Info.plist` 中的 `CFBundleShortVersionString`
- **Android**: `android/app/build.gradle` 中的 `versionName`

## 常见问题

### Q: 更新网站后需要重新发布应用吗？

**A**: 不需要。由于使用远程模式，应用直接加载 voicica.ai 网站，网站更新后用户自动获得最新内容。只有以下情况需要重新发布：
- 修改应用图标
- 修改应用名称
- 添加新的原生功能
- 修改 Capacitor 配置

### Q: 如何处理 OAuth 登录？

**A**: `allowNavigation` 配置已包含常用 OAuth 提供商域名。如果添加新的登录方式，需要将相关域名加入白名单。

### Q: 应用启动很慢怎么办？

**A**:
1. 确保网站本身加载速度快
2. 使用 Service Worker 缓存关键资源
3. 优化启动画面显示时机

### Q: 如何添加推送通知？

**A**: 需要安装 `@capacitor/push-notifications` 插件并配置 Firebase (Android) 和 APNs (iOS)。

## 相关资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor iOS 指南](https://capacitorjs.com/docs/ios)
- [Capacitor Android 指南](https://capacitorjs.com/docs/android)
- [Apple Developer](https://developer.apple.com/)
- [Google Play Console](https://play.google.com/console)

---

**最后更新**: 2024
**维护者**: 开发团队