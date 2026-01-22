# PWA Icons

此文件夹包含 PWA (Progressive Web App) 图标，用于用户"添加到主屏幕"时显示。

## 图标文件

| 文件 | 尺寸 | 用途 |
|------|------|------|
| icon-48.webp | 48x48 | 小图标 |
| icon-72.webp | 72x72 | Android 低密度 |
| icon-96.webp | 96x96 | Android 中密度 |
| icon-128.webp | 128x128 | Chrome Web Store |
| icon-192.webp | 192x192 | Android 主屏幕 |
| icon-256.webp | 256x256 | 中等尺寸 |
| icon-512.webp | 512x512 | 启动画面/高清 |

## 生成方式

这些图标由 `@capacitor/assets` 自动生成。

### 更新图标步骤

1. 准备源文件放到 `resources/` 文件夹：
   - `icon-only.png` (1024x1024) - iOS 和 Android 旧版图标
   - `icon-foreground.png` (1024x1024) - Android 自适应图标前景
   - `icon-background.png` (1024x1024) - Android 自适应图标背景
   - `splash.png` (2732x2732) - 启动画面
   - `splash-dark.png` (2732x2732) - 深色模式启动画面

2. 运行生成命令：
   ```bash
   npm run cap:assets
   ```

3. 脚本会自动：
   - 生成所有尺寸的图标
   - 移动 PWA 图标到 `public/icons/`
   - 修复 `manifest.json` 中的路径

## 相关文件

- `public/manifest.json` - PWA 配置，引用这些图标
- `resources/` - 图标源文件
- `scripts/fix-pwa-icons.js` - 后处理脚本
