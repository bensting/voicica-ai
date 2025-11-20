# AI Voice Labs - Claude Memory Reference

> 本文档用于 Claude AI 助手的项目记忆，包含项目架构、技术栈、代码规范等关键信息。

## 项目概述

**项目名称**: AI Voice Labs
**项目类型**: AI 语音生成平台
**主要功能**: 文字转语音、语音克隆、语音模型管理

## 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **认证**: Firebase Authentication
- **HTTP 客户端**: Axios
- **状态管理**: React Context API
- **国际化**: 支持英文、简体中文、繁体中文

### 后端
- **框架**: FastAPI (Python)
- **认证**: Firebase Admin SDK
- **API 基础路径**: `/api/v1`

## 项目结构

```
src/
├── app/                           # Next.js 页面 (App Router)
│   ├── login/                    # 登录页面
│   ├── settings/                 # 设置页面（用户中心）
│   │   ├── layout.tsx           # 设置共享布局（含侧边栏）
│   │   ├── my-account/          # 我的账户
│   │   ├── my-benefits/         # 我的权益
│   │   ├── orders/              # 订单列表
│   │   ├── coupons/             # 我的优惠券
│   │   └── messages/            # 消息中心
│   ├── subscription/            # 订阅管理
│   └── page.tsx                 # 首页
│
├── components/                   # React 组件
│   ├── layout/                  # 布局组件
│   │   └── Navbar/              # 导航栏
│   │       ├── UserMenu.tsx     # 用户菜单（重构后使用配置）
│   │       └── UserMenuItem.tsx # 菜单项组件
│   └── features/                # 功能组件
│       └── settings/            # 设置相关组件
│           ├── SettingsSidebar.tsx    # 设置侧边栏（桌面端垂直、移动端水平）
│           └── my-account/            # 我的账户专用组件
│
├── config/                       # 配置文件
│   └── userMenuConfig.tsx       # 用户菜单配置（集中管理菜单项）
│
├── contexts/                     # React Context
│   ├── AuthContext.tsx          # 认证状态管理
│   ├── UserContext.tsx          # 用户信息管理
│   └── LanguageContext.tsx      # 语言状态管理
│
├── lib/                          # 第三方库配置
│   └── firebase.ts              # Firebase 初始化
│
├── services/                     # API 服务层
│   └── api.ts                   # API 客户端封装（自动添加 Token）
│
└── i18n/                         # 国际化
    └── locales/                 # 语言文件
        ├── en.json              # 英文
        ├── zh-CN.json           # 简体中文
        └── zh-TW.json           # 繁体中文
```

## 重要设计模式

### 1. 配置化管理
**适用场景**: 菜单项、导航项、表单配置等
**示例**: `src/config/userMenuConfig.tsx`

```typescript
// 配置文件定义
export const userMenuItems: UserMenuItemConfig[] = [
  {
    id: 'subscription',
    labelKey: 'navbar.subscription',
    href: '/subscription',
    icon: <SvgIcon />,
  },
  // ... 更多菜单项
];

// 组件中使用
{userMenuItems.map((item) => (
  <MenuItem key={item.id} {...item} />
))}
```

**优势**:
- 集中管理，易于维护
- 添加/删除项目不需要修改组件代码
- 类型安全

### 2. 组件化设计
**原则**: 每个独立功能封装为组件
**示例**: `UserMenuItem.tsx`

```typescript
interface UserMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}
```

### 3. Layout 共享
**适用场景**: 多个页面共享相同布局
**示例**: `src/app/settings/layout.tsx`

```typescript
export default function SettingsLayout({ children }) {
  return (
    <div>
      <SettingsSidebar />  {/* 所有子页面共享侧边栏 */}
      <main>{children}</main>
    </div>
  );
}
```

## 文件组织规范

### 1. 页面结构
```
feature/
├── layout.tsx           # 共享布局（如果需要）
├── page.tsx            # 主页面（如果是单页面功能）
├── sub-feature-1/      # 子功能1
│   └── page.tsx
└── sub-feature-2/      # 子功能2
    └── page.tsx
```

### 2. 组件结构
```
components/features/feature-name/
├── MainComponent.tsx           # 共享组件
└── sub-feature/               # 特定子功能的组件
    ├── Component1.tsx
    └── Component2.tsx
```

**原则**:
- 共享组件放在父级
- 专用组件放在对应子文件夹
- 避免组件混乱和耦合

## 认证流程

### 用户登录
1. 用户点击社交登录（Google/Apple/X）
2. Firebase Authentication 处理登录
3. 获取 Firebase ID Token
4. AuthContext 保存用户状态
5. 自动调用后端 `/api/v1/users/me`（首次登录自动注册）

### API 调用
1. 前端调用 API 方法（如 `userAPI.getCurrentUser()`）
2. API Client 自动添加 `Authorization: Bearer {token}` Header
3. 后端使用 Firebase Admin SDK 验证 Token
4. 返回数据

**注意**: Firebase SDK 自动处理 Token 刷新，无需手动实现

## 国际化

### 翻译文件位置
`src/i18n/locales/[locale].json`

### 使用方法
```typescript
const { t } = useLanguage();
return <div>{t('settings.title')}</div>;
```

### 添加新翻译
在三个语言文件中同时添加：
- `en.json`: 英文
- `zh-CN.json`: 简体中文
- `zh-TW.json`: 繁体中文

## 响应式设计

### 断点使用
- **移动端**: 默认样式
- **桌面端**: `lg:` 前缀（1024px+）

### 示例
```tsx
{/* 移动端水平滚动，桌面端垂直显示 */}
<div className="lg:hidden">
  <SettingsSidebar variant="horizontal" />
</div>
<aside className="hidden lg:block">
  <SettingsSidebar />
</aside>
```

## 样式规范

### Tailwind CSS 使用
- 使用 Tailwind 工具类
- 主题色: 紫色（purple-600）
- 圆角: rounded-lg
- 阴影: shadow-sm
- 边框: border-gray-200

### 常用样式组合
```tsx
// 卡片
className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"

// 按钮 - 主要操作
className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"

// 按钮 - 次要操作
className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
```

## API 开发流程

### 1. 后端定义接口
```python
@router.get("/api/v1/users/me")
async def get_current_user(current_user: dict = Depends(get_current_user)):
    return user_data
```

### 2. 前端添加 API 方法
```typescript
// services/api.ts
export const userAPI = {
  getCurrentUser: () => apiClient.get('/api/v1/users/me'),
};
```

### 3. 组件中使用
```typescript
import { userAPI } from '@/services/api';
const user = await userAPI.getCurrentUser();
```

## 环境变量

### 必需配置
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_API_BASE_URL`: 后端 API 地址

### 自动注入的环境变量
- `NEXT_PUBLIC_APP_VERSION`: 应用版本号（构建时从 package.json 自动注入）

### 配置方法
1. 复制 `.env.example` 到 `.env.local`
2. 填写实际值
3. 重启开发服务器

## 版本管理

本项目使用 **package.json 作为版本号的单一来源**，通过自动化脚本确保版本一致性。

### 版本号同步机制

1. **主版本源**: `package.json` 的 `version` 字段
2. **自动同步目标**:
   - `public/manifest.json` - PWA manifest 版本号
   - `NEXT_PUBLIC_APP_VERSION` - 应用内环境变量

### 更新版本号

```bash
# 方法 1: 使用 npm version（推荐）
npm version patch   # 0.1.0 -> 0.1.1 (Bug 修复)
npm version minor   # 0.1.0 -> 0.2.0 (新功能)
npm version major   # 0.1.0 -> 1.0.0 (重大更新)

# 方法 2: 手动修改 package.json 后同步
npm run version:sync
```

### 自动化流程

每次构建时自动执行:
1. `prebuild` hook 运行 `scripts/sync-version.js`
2. 从 `package.json` 读取版本号
3. 自动更新 `manifest.json`
4. Next.js 构建时注入到 `process.env.NEXT_PUBLIC_APP_VERSION`

### 在代码中使用版本号

```tsx
// 任何组件中
const version = process.env.NEXT_PUBLIC_APP_VERSION;
return <div>v{version}</div>;
```

**示例**: Footer 组件显示版本号 (`src/components/layout/Footer/index.tsx:43`)

**详细文档**: 查看 `VERSION_MANAGEMENT.md`

## PWA 版本更新机制

### 工作流程
1. 用户访问应用时检查 Service Worker 更新
2. 检测到新版本时显示更新提示组件
3. 用户确认后激活新版本并刷新页面

### 关键配置
- `next.config.ts`: `skipWaiting: false` - 等待用户确认
- `PWAUpdatePrompt` 组件: 友好的更新提示界面
- 每小时自动检查更新一次

### 更新策略
- **NetworkFirst**: 优先获取网络资源
- **缓存过期**: 24 小时
- **用户控制**: 可选择"立即更新"或"稍后"

## 最近完成的功能

### 1. PWA 版本管理系统 (2024)
- 统一版本号管理（package.json 作为单一来源）
- 自动版本同步脚本
- 用户友好的更新提示
- 支持多语言的更新通知

### 2. 用户中心重构 (2024)
- 创建 settings 布局系统
- 实现侧边栏导航（桌面端垂直、移动端水平）
- 页面结构优化为子路由模式
- 组件按功能模块组织

### 3. 用户菜单重构
- 配置化管理菜单项 (`userMenuConfig.tsx`)
- 组件化菜单项 (`UserMenuItem.tsx`)
- 支持动态路由和特殊操作

## 代码规范

### TypeScript
- 使用接口定义 Props
- 导出配置类型供其他文件使用
- 避免使用 `any`

### React
- 使用函数式组件
- Props 解构传递
- 使用 TypeScript 接口定义 Props

### 文件命名
- 组件: PascalCase (如 `UserMenu.tsx`)
- 配置: camelCase (如 `userMenuConfig.tsx`)
- 页面: `page.tsx` 或 `layout.tsx`

### 注释
- 组件顶部添加功能说明
- 复杂逻辑添加行内注释
- 配置文件添加使用示例

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产环境
npm start

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 注意事项

### 1. 不要做的事
- ❌ 不要在组件中硬编码文本，使用国际化
- ❌ 不要直接调用 Firebase，使用 AuthContext
- ❌ 不要在服务端组件使用 Context
- ❌ 不要创建不必要的文件（如 README.md）

### 2. 应该做的事
- ✅ 使用配置文件管理重复数据
- ✅ 组件化可复用的 UI 元素
- ✅ 使用 Layout 共享页面结构
- ✅ 保持文件组织清晰

## 下一步开发计划

- [ ] 完善各个设置子页面内容
- [ ] 实现订阅管理功能
- [ ] 添加支付集成
- [ ] 优化移动端体验
- [ ] 添加更多语音功能

---

**最后更新**: 2024
**维护者**: 开发团队