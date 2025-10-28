# PWA (Progressive Web App) 配置说明

本项目已配置 PWA 支持，允许用户将应用安装到设备主屏幕。

## 构建命令

### 推荐：使用 Webpack 构建（完整 PWA 支持）
```bash
npm run build:webpack
npm start
```

### 备选：使用 Turbopack 构建（更快但 PWA 支持有限）
```bash
npm run build
npm start
```

**注意**: Turbopack 构建会显示 PWA 警告，但基本功能仍可正常工作。生产环境建议使用 Webpack 构建。

## PWA 功能

- ✅ 离线访问（Service Worker 缓存）
- ✅ 安装到主屏幕
- ✅ 独立窗口运行（无浏览器 UI）
- ✅ 快捷方式（直达 TTS Studio）
- ✅ 自定义图标和启动画面
- ✅ 推送通知支持（可扩展）

## 测试 PWA

1. **本地测试**:
   ```bash
   npm run build:webpack
   npm start
   ```

2. **打开浏览器**:
   - 访问 `http://localhost:3000`
   - 打开 Chrome DevTools (F12)
   - 前往 `Application` 标签

3. **检查配置**:
   - **Manifest**: 查看 Web App Manifest 配置
   - **Service Workers**: 确认 SW 已注册并激活
   - **Storage**: 查看缓存的资源

4. **安装 PWA**:
   - 在地址栏右侧点击"安装"按钮
   - 或在 Chrome 菜单中选择"安装 AI Voice Labs"

## 文件结构

```
public/
├── manifest.json           # Web App Manifest 配置
├── icon.svg                # 应用图标（SVG）
├── icons/                  # PNG 图标目录（可选）
│   └── README.md          # 图标生成说明
├── sw.js                   # Service Worker（自动生成）
└── workbox-*.js           # Workbox 库（自动生成）
```

## 自定义配置

### 修改应用信息
编辑 `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "App",
  "theme_color": "#9333ea",
  "background_color": "#ffffff"
}
```

### 修改 PWA 行为
编辑 `next.config.ts`:
```typescript
withPWA({
  dest: 'public',              // SW 输出目录
  register: true,              // 自动注册 SW
  skipWaiting: true,           // 立即激活新 SW
  disable: false,              // 强制启用/禁用
})
```

### 添加自定义图标
1. 使用在线工具生成多尺寸 PNG：
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

2. 或使用命令行工具：
   ```bash
   # 使用 ImageMagick
   convert public/icon.svg -resize 192x192 public/icons/icon-192x192.png
   convert public/icon.svg -resize 512x512 public/icons/icon-512x512.png
   ```

3. 更新 `manifest.json` 中的 icons 数组

## 环境说明

- **开发环境**: PWA 默认禁用（加快开发速度）
- **生产环境**: PWA 自动启用

## 故障排查

### Service Worker 未注册
1. 确保使用 HTTPS 或 localhost
2. 检查浏览器控制台是否有错误
3. 清除浏览器缓存并重新加载

### 安装按钮不显示
1. 确认 `manifest.json` 配置正确
2. 检查图标文件是否存在
3. 确保使用生产构建（`npm run build:webpack`）

### 更新不生效
1. Service Worker 可能正在使用旧版本
2. 在 DevTools → Application → Service Workers 中点击 "Unregister"
3. 刷新页面重新注册

## 部署建议

部署到生产环境时：
1. 使用 `npm run build:webpack` 构建
2. 确保服务器支持 HTTPS（PWA 必需）
3. 配置正确的 CSP 头（已在 next.config.ts 中配置）
4. 测试所有 PWA 功能是否正常

## 相关资源

- [Next PWA 文档](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA 最佳实践](https://web.dev/progressive-web-apps/)