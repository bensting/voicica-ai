# 版本管理指南

本项目使用 `package.json` 作为版本号的单一来源，通过自动化脚本确保所有文件的版本号保持一致。

## 快速参考

### 🚀 日常使用

```bash
# 1. 修复 Bug 后发布
npm version patch        # 0.1.0 -> 0.1.1
npm run build:webpack
# 部署

# 2. 添加新功能后发布
npm version minor        # 0.1.0 -> 0.2.0
npm run build:webpack
# 部署

# 3. 重大更新后发布
npm version major        # 0.1.0 -> 1.0.0
npm run build:webpack
# 部署
```

### ⚠️ 重要提醒

| 问题 | 回答 |
|------|------|
| 只改代码不改版本号会触发更新吗？ | ✅ 会！PWA 更新依赖 Service Worker 文件变化，不依赖版本号 |
| 只改版本号不构建会更新吗？ | ❌ 不会！必须重新构建才会生效 |
| 版本号有什么用？ | 用于显示给用户、问题排查、发布管理 |
| 构建时会自动同步版本吗？ | ✅ 会！`prebuild` hook 会自动同步到 manifest.json |

## 版本号位置

### 主版本源
- `package.json` - 唯一的版本号定义位置

### 自动同步位置
- `public/manifest.json` - PWA manifest 版本号（自动同步）
- `process.env.NEXT_PUBLIC_APP_VERSION` - 应用内可访问的版本号（构建时注入）

## 如何更新版本

### 什么时候需要更新版本号？

根据语义化版本规范，不同类型的更新对应不同的版本变化：

| 更新类型 | 示例 | 版本变化 | npm 命令 |
|---------|------|---------|----------|
| 🐛 Bug 修复 | 修复登录错误、样式问题 | 0.1.0 → 0.1.1 | `npm version patch` |
| ✨ 新功能 | 添加新页面、新组件 | 0.1.0 → 0.2.0 | `npm version minor` |
| 💥 重大更新 | 重写架构、不兼容旧版 | 0.1.0 → 1.0.0 | `npm version major` |
| 📦 依赖更新 | 升级 React、Next.js | 0.1.0 → 0.1.1 | `npm version patch` |
| 🎨 样式调整 | 修改颜色、布局 | 0.1.0 → 0.1.1 | `npm version patch` |

### 方法 1: 使用 npm version 命令（推荐）✅

这是最简单、最安全的方式，会自动更新 `package.json` 并创建 git tag。

```bash
# 补丁版本（Bug 修复、小改动）
npm version patch
# 示例: 0.1.0 -> 0.1.1

# 次版本（新功能、向后兼容）
npm version minor
# 示例: 0.1.0 -> 0.2.0

# 主版本（重大更新、破坏性变更）
npm version major
# 示例: 0.1.0 -> 1.0.0
```

**自动完成的操作：**
1. ✅ 更新 `package.json` 中的版本号
2. ✅ 创建 git commit（消息如 `v0.1.1`）
3. ✅ 创建 git tag（如 `v0.1.1`）

**完整示例：**
```bash
# 1. 确保工作区干净
git status

# 2. 更新版本
npm version patch
# 输出: v0.1.1

# 3. 推送到远程（包括 tag）
git push && git push --tags

# 4. 构建部署
npm run build:webpack
```

### 方法 2: 手动修改 package.json

如果你不想创建 git tag，可以手动修改：

```bash
# 1. 编辑 package.json
vim package.json
# 或使用任何编辑器修改 "version": "0.1.0" -> "0.1.1"

# 2. 手动同步版本到其他文件
npm run version:sync

# 3. 提交更改
git add package.json public/manifest.json
git commit -m "chore: bump version to 0.1.1"

# 4. 构建部署
npm run build:webpack
```

### 方法 3: 自定义版本号

如果需要特殊版本号格式（如预发布版本）：

```bash
# 预发布版本
npm version prerelease --preid=beta
# 示例: 0.1.0 -> 0.1.1-beta.0

# 指定确切版本
npm version 1.0.0-rc.1
# 直接设置为 1.0.0-rc.1
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

### 更新检测原理

⚠️ **重要**：PWA 更新提示**不依赖**版本号，而是通过检测 **Service Worker 文件内容的变化**！

当用户访问应用时：

1. 浏览器检查 Service Worker 文件是否有变化（字节级比对）
2. 如果文件内容改变，下载新的 Service Worker
3. 新 Service Worker 进入 waiting 状态
4. 显示更新提示组件（PWAUpdatePrompt）
5. 用户点击"立即更新"后激活新 Service Worker 并刷新页面

### 什么会触发 PWA 更新提示？

#### ✅ 会触发更新的情况

1. **代码变更**（即使版本号不变）
   - 修改任何 React 组件
   - 修改页面文件
   - 修改样式文件
   - 修改配置文件
   - 然后执行 `npm run build:webpack`

   → Service Worker 文件会变化 → **显示更新提示**

2. **依赖更新**
   - 升级 npm 包
   - 修改 next.config.ts
   - 然后执行 `npm run build:webpack`

   → Service Worker 文件会变化 → **显示更新提示**

3. **版本号更新**
   - 虽然版本号本身不触发更新
   - 但构建时 Service Worker 会包含新的资源哈希
   - 然后执行 `npm run build:webpack`

   → Service Worker 文件会变化 → **显示更新提示**

#### ❌ 不会触发更新的情况

1. **仅修改 manifest.json**（不重新构建）
   - Service Worker 文件内容未变

   → **不显示更新提示**

2. **仅修改 package.json 版本号**（不重新构建）
   - Service Worker 文件内容未变

   → **不显示更新提示**

3. **服务器端数据变化**
   - API 返回的数据改变
   - 数据库内容变化

   → **不显示更新提示**

### 版本号的作用

虽然 PWA 更新不依赖版本号，但版本号仍然很重要：

1. **用户可见性**：Footer 显示版本号，让用户知道当前使用的版本
2. **问题排查**：用户报告问题时可以提供版本号
3. **发布管理**：团队内部沟通和发布记录
4. **Git 标签**：与代码仓库版本对应

### 常见场景

#### 场景 1：修改代码但忘记更新版本号

```bash
# 1. 修改了代码
vim src/components/MyComponent.tsx

# 2. 直接构建（忘记更新版本号）
npm run build:webpack

# 结果：
# ✅ PWA 会显示更新提示（因为 Service Worker 变了）
# ⚠️ 但 Footer 显示的版本号还是旧的（如 v0.1.0）
```

**影响**：用户能收到更新提示，但版本号显示不准确。

**建议**：养成习惯，发布前先更新版本号。

#### 场景 2：只更新版本号不重新构建

```bash
# 1. 更新版本号
npm version patch

# 2. 忘记构建就部署
# （直接推送到服务器）

# 结果：
# ❌ PWA 不会显示更新提示（Service Worker 未变）
# ❌ 版本号也不会更新（因为没有构建）
```

**影响**：用户看不到任何变化。

**解决**：必须重新构建才能应用版本号变化。

#### 场景 3：正确的发布流程

```bash
# 1. 修改代码
vim src/components/MyComponent.tsx

# 2. 更新版本号
npm version patch   # 0.1.0 -> 0.1.1

# 3. 构建
npm run build:webpack

# 4. 部署
# （推送到服务器）

# 结果：
# ✅ PWA 显示更新提示（Service Worker 变了）
# ✅ Footer 显示新版本号（v0.1.1）
# ✅ 用户体验完整
```

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