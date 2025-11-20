# 版本管理指南

本项目使用 `package.json` 作为版本号的单一来源，通过自动化脚本确保所有文件的版本号保持一致。

## 版本号位置

### 主版本源
- `package.json` - 唯一的版本号定义位置

### 自动同步位置
- `public/manifest.json` - PWA manifest 版本号（自动同步）
- `process.env.NEXT_PUBLIC_APP_VERSION` - 应用内可访问的版本号（构建时注入）

## 如何更新版本

### 方法 1: 使用 npm version 命令（推荐）

```bash
# 补丁版本（Bug 修复）: 0.1.0 -> 0.1.1
npm version patch

# 次版本（新功能）: 0.1.0 -> 0.2.0
npm version minor

# 主版本（破坏性更新）: 0.1.0 -> 1.0.0
npm version major
```

### 方法 2: 手动修改 package.json

1. 编辑 `package.json` 中的 `version` 字段
2. 运行同步脚本:
   ```bash
   npm run version:sync
   ```

## 自动化流程

### 构建时自动同步

每次运行 `npm run build` 时，会自动执行以下流程:

1. **prebuild hook** 执行 `scripts/sync-version.js`
2. 从 `package.json` 读取版本号
3. 自动更新 `public/manifest.json` 中的版本号
4. Next.js 构建时将版本号注入到环境变量 `NEXT_PUBLIC_APP_VERSION`

### 相关脚本

```json
{
  "scripts": {
    "prebuild": "node scripts/sync-version.js",     // 构建前自动同步
    "version:sync": "node scripts/sync-version.js"   // 手动同步版本号
  }
}
```

## 在代码中使用版本号

### 在客户端组件中

```tsx
// 任何客户端组件
export default function MyComponent() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return <div>当前版本: v{version}</div>;
}
```

### 在服务端组件中

```tsx
// 服务端组件也可以访问
export default function ServerComponent() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return <div>版本: {version}</div>;
}
```

### 示例位置

- **Footer 组件**: 页面底部显示版本号 (src/components/layout/Footer/index.tsx:43)

## PWA 更新机制

当用户访问应用时,PWA 会:

1. 检查 Service Worker 是否有更新
2. 比对 manifest.json 中的版本号
3. 如果有新版本,显示更新提示
4. 用户点击"立即更新"后刷新应用

## 版本号格式

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范:

```
主版本号.次版本号.修订号

例如: 1.2.3
- 1: 主版本号（重大更新）
- 2: 次版本号（新功能）
- 3: 修订号（Bug 修复）
```

## 发布检查清单

发布新版本前请确保:

- [ ] 已更新版本号（使用 `npm version` 或手动修改）
- [ ] 运行 `npm run version:sync` 确保同步
- [ ] 测试构建: `npm run build`
- [ ] 检查版本号是否正确显示在应用中
- [ ] 提交代码并打标签（如果使用 git）

```bash
# 完整发布流程示例
npm version minor          # 更新版本号
npm run version:sync       # 同步版本号
npm run build             # 测试构建
git add .
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
git tag "v$(node -p "require('./package.json').version")"
git push && git push --tags
```

## 故障排查

### manifest.json 版本未更新

运行手动同步:
```bash
npm run version:sync
```

### 应用中版本号未显示

1. 确认已重新构建: `npm run build`
2. 检查环境变量注入: `next.config.ts` 中的 `env` 配置
3. 清除缓存并重新构建

### 脚本执行失败

检查 Node.js 版本（建议 >= 16）:
```bash
node --version
```

## 相关文件

- `scripts/sync-version.js` - 版本同步脚本
- `next.config.ts` - Next.js 配置（版本号注入）
- `package.json` - 版本号定义
- `public/manifest.json` - PWA 配置
- `src/components/layout/PWAUpdatePrompt.tsx` - 更新提示组件