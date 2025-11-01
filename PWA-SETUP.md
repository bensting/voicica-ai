# PWA 配置说明

## ✅ 已完成的配置

你的项目已经完整配置了 PWA（Progressive Web App），包括：

### 1. Manifest 配置 (`public/manifest.json`)
- ✅ 应用名称、图标、主题色
- ✅ 8 个不同尺寸的图标 (72x72 到 512x512)
- ✅ 独立应用模式 (`display: "standalone"`)
- ✅ 快捷方式配置

### 2. HTML Meta 标签 (`src/app/layout.tsx`)
- ✅ Manifest 链接
- ✅ iOS Web App 支持
- ✅ 主题色配置
- ✅ Viewport 配置

### 3. Service Worker (`next.config.ts`)
- ✅ next-pwa 插件配置
- ✅ 自动注册 Service Worker
- ✅ 开发环境禁用（避免缓存问题）
- ✅ 生产环境自动启用

### 4. Git 忽略规则 (`.gitignore`)
- ✅ 忽略自动生成的 SW 文件

## 🚀 如何测试 PWA

### 方法 1: 本地生产构建测试

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产服务器
npm start

# 3. 在浏览器中访问
# http://localhost:3000
```

**注意**: Service Worker 只在生产构建中启用

### 方法 2: 使用 Vercel/Netlify 部署测试

部署到生产环境后，访问你的网站：

#### Android (Chrome/Edge):
1. 访问网站
2. 浏览器会自动显示"安装应用"横幅
3. 或通过浏览器菜单 → "安装应用" / "添加到主屏幕"

#### iOS (Safari):
1. 访问网站
2. 点击"分享"按钮
3. 选择"添加到主屏幕"

### 方法 3: Chrome DevTools 测试

1. 打开 Chrome DevTools (F12)
2. 切换到 "Application" 标签
3. 左侧菜单查看：
   - **Manifest**: 检查 manifest.json 是否正确加载
   - **Service Workers**: 查看 SW 注册状态
   - **Storage**: 查看缓存策略

## 📱 PWA 功能说明

### 当前启用的功能

1. **安装到主屏幕**
   - Android: 自动提示
   - iOS: 手动添加
   - 桌面: Chrome/Edge 显示安装图标

2. **独立应用模式**
   - 全屏运行（无浏览器地址栏）
   - 独立应用图标
   - 任务切换器中显示为独立应用

3. **离线支持** (Service Worker)
   - 自动缓存静态资源
   - 离线时可访问已缓存页面

4. **快速加载**
   - Service Worker 预缓存关键资源
   - 后续访问速度更快

### 配置选项说明

```typescript
// next.config.ts
withPWA({
  dest: 'public',              // SW 文件输出目录
  register: true,              // 自动注册 SW
  skipWaiting: true,           // 立即激活新 SW
  disable: process.env.NODE_ENV === 'development',  // 开发环境禁用
})
```

## 🔍 验证 PWA 安装成功

### Chrome DevTools Lighthouse
1. 打开 DevTools → "Lighthouse" 标签
2. 选择 "Progressive Web App"
3. 点击 "Generate report"
4. 查看 PWA 评分和建议

### 检查清单
- [ ] Manifest 文件加载成功
- [ ] Service Worker 注册成功
- [ ] 图标正确显示
- [ ] 可以安装到主屏幕
- [ ] 独立模式运行（无地址栏）
- [ ] 离线时部分功能可用

## 🎨 自定义配置

### 修改缓存策略

如需自定义 Service Worker 缓存策略，可以创建 `worker/index.js`:

```javascript
// worker/index.js
import { precacheAndRoute } from 'workbox-precaching';

// 预缓存构建生成的资源
precacheAndRoute(self.__WB_MANIFEST);

// 自定义缓存策略
// ...
```

然后更新 `next.config.ts`:

```typescript
withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  swSrc: 'worker/index.js',  // 自定义 SW 源文件
  disable: process.env.NODE_ENV === 'development',
})
```

## 📚 相关资源

- [Next PWA 文档](https://github.com/shadowwalker/next-pwa)
- [Web.dev PWA 指南](https://web.dev/progressive-web-apps/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox 文档](https://developers.google.com/web/tools/workbox)

## ⚠️ 注意事项

1. **HTTPS 要求**: 生产环境必须使用 HTTPS（Service Worker 要求）
2. **开发环境**: 配置了开发环境禁用，避免缓存导致的问题
3. **缓存更新**: 修改静态资源后，用户可能需要强制刷新才能看到最新版本
4. **iOS 限制**: iOS Safari 对 PWA 的支持有限，某些功能可能不可用

## 🐛 故障排查

### Service Worker 未注册
- 确保在生产环境（`npm run build && npm start`）
- 检查浏览器控制台是否有错误
- 确保使用 HTTPS（本地开发可用 localhost）

### 无法安装到主屏幕
- 检查 manifest.json 是否正确
- 确保至少有 192x192 和 512x512 图标
- Android: 确保 Service Worker 已注册

### 离线不工作
- 确保 Service Worker 已激活
- 检查 DevTools → Application → Cache Storage
- 访问过的页面才会被缓存