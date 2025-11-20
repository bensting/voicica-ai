# Firebase Auth 迁移指南

本文档说明如何从 Next-Auth (Auth.js) 迁移到 Firebase Auth。

## 为什么迁移到 Firebase Auth？

### 多端统一认证
- ✅ Web、iOS、Android 使用同一套认证系统
- ✅ 统一的用户 ID (Firebase UID)
- ✅ Token 自动管理和刷新
- ✅ 丰富的 Firebase 生态支持

### 架构优势
```
Firebase Auth 架构:
- Web (Next.js) → Firebase SDK → Firebase Token
- iOS App → Firebase SDK → Firebase Token
- Android App → Firebase SDK → Firebase Token
└─→ 后端 (Server Actions) → Firebase Admin SDK 验证 Token
```

## 已完成的迁移准备

### 1. ✅ Firebase Admin SDK 配置
**文件**: `src/lib/firebase-admin.ts`
- 服务端 Firebase Admin 初始化
- 用于验证客户端传来的 Firebase ID Token

### 2. ✅ 新认证逻辑
**文件**: `src/lib/auth-firebase.ts`
- 替代 `src/lib/auth.ts` (原 Auth.js 版本)
- `getUserOrAnonymous()` - 支持 Firebase 用户 + 匿名用户
- `verifyFirebaseToken()` - 验证 Firebase token
- `createOrUpdateFirebaseUser()` - 自动注册/更新用户

### 3. ✅ Firebase Auth Context
**文件**: `src/contexts/FirebaseAuthContext.tsx`
- 客户端认证状态管理
- 提供登录方法: Google, Apple, Twitter
- 自动 token 刷新 (每 55 分钟)
- Token 同步到 Cookie (供 middleware 使用)

### 4. ✅ Middleware
**文件**: `src/middleware.ts`
- 拦截所有请求
- 从 cookie 读取 Firebase token
- 添加到 request header (`Authorization: Bearer {token}`)
- Server Actions 通过 `headers()` 读取

## 迁移步骤

### 第1步: 配置环境变量

在 `.env.local` 中添加 Firebase Admin 凭据:

```bash
# Firebase Admin SDK (服务端)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (已有)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

**获取 Firebase Admin 凭据**:
1. 打开 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目 → 设置 → 服务账号
3. 点击"生成新的私钥"
4. 复制 JSON 文件中的字段到 `.env.local`

### 第2步: 修改 Server Actions 导入

将所有 Server Actions 中的认证导入从:
```typescript
import { getUserOrAnonymous } from '@/lib/auth';
```

改为:
```typescript
import { getUserOrAnonymous } from '@/lib/auth-firebase';
```

**需要修改的文件**:
- `src/actions/tts.ts`
- `src/actions/user.ts`
- 其他使用 `getUserOrAnonymous()` 的 Server Actions

### 第3步: 更新根布局

**文件**: `src/app/layout.tsx`

添加 `FirebaseAuthProvider`:

```tsx
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FirebaseAuthProvider>
          {/* 其他 Providers */}
          {children}
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
```

### 第4步: 更新登录页面

**文件**: `src/app/login/page.tsx` (或登录组件)

使用 Firebase Auth Context:

```tsx
'use client';

import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, signInWithApple, signInWithTwitter, loading } = useFirebaseAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.push('/'); // 登录成功后跳转
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败，请重试');
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin} disabled={loading}>
        使用 Google 登录
      </button>
      <button onClick={signInWithApple} disabled={loading}>
        使用 Apple 登录
      </button>
      <button onClick={signInWithTwitter} disabled={loading}>
        使用 Twitter 登录
      </button>
    </div>
  );
}
```

### 第5步: 更新用户菜单/Navbar

替换现有的认证逻辑:

```tsx
'use client';

import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

export function UserMenu() {
  const { user, signOut, loading } = useFirebaseAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <a href="/login">登录</a>;
  }

  return (
    <div>
      <img src={user.photoURL || '/default-avatar.png'} alt="avatar" />
      <span>{user.displayName || user.email}</span>
      <button onClick={signOut}>登出</button>
    </div>
  );
}
```

### 第6步: 移除 Auth.js 依赖

完成迁移后，可以删除:

1. **删除文件**:
   - `src/lib/auth-next.ts` (Next-Auth 配置)
   - `src/app/api/auth/[...nextauth]/route.ts` (API route)

2. **删除 npm 包**:
```bash
npm uninstall next-auth @auth/prisma-adapter
```

3. **删除 Prisma Schema** (如果不需要):
   - `Account` model
   - `Session` model
   - `VerificationToken` model
   - `User` model 中的 Auth.js 相关字段

## 数据库迁移

### 用户表调整

**现有 Prisma Schema** (Auth.js 版本):
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  appUserId     String?   @unique
}
```

**新 Schema** (Firebase 版本):
```prisma
model users {
  user_id           String    @id // Firebase UID
  email             String
  display_name      String?
  avatar_url        String?
  credits           Int       @default(1000)
  total_credits_used Int      @default(0)
  is_premium        Boolean   @default(false)
  created_at        DateTime  @default(now())
  last_login_at     DateTime  @default(now())

  // 关联
  tts_records       tts_records[]
  subscriptions     subscriptions[]
  @@index([email])
}
```

### 迁移现有用户数据 (可选)

如果需要保留现有用户,可以:

1. **导出现有用户数据**
2. **在 Firebase Console 创建对应用户**
3. **更新数据库中的 `user_id` 为 Firebase UID**

或者直接从头开始,让用户重新登录。

## 测试清单

完成迁移后,测试以下功能:

- [ ] Google 登录 → 成功后跳转 → 用户信息正确显示
- [ ] Apple 登录 → 成功后跳转
- [ ] Twitter 登录 → 成功后跳转
- [ ] 登出 → 清除 token → 跳转到登录页
- [ ] Server Actions 能获取到正确的 `user_id`
- [ ] 匿名用户降级 → 未登录时仍能使用（基于设备指纹）
- [ ] Token 自动刷新 → 1小时后 token 仍然有效
- [ ] TTS 生成 → 积分正确扣减
- [ ] 历史记录 → 显示当前用户的记录

## 认证流程图

```
┌─────────────────────────────────────────────┐
│          用户点击登录按钮                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   FirebaseAuthContext.signInWithGoogle()   │
│   - 弹出 Google 登录窗口                      │
│   - 用户选择账号                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Firebase Auth 返回用户信息                   │
│   - user.uid (Firebase UID)                │
│   - user.email                             │
│   - user.displayName                       │
│   - user.photoURL                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   onAuthStateChanged 监听到变化                │
│   1. 获取 ID Token                           │
│   2. 保存到 State (user, token)              │
│   3. 保存到 Cookie (firebase-token)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   用户调用 Server Action                      │
│   (例如: createTtsTask)                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Middleware 拦截请求                         │
│   1. 从 cookie 读取 firebase-token           │
│   2. 添加到 request header                   │
│      Authorization: Bearer {token}          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Server Action 执行                         │
│   1. 调用 getUserOrAnonymous()               │
│   2. 从 header 读取 token                    │
│   3. Firebase Admin 验证 token               │
│   4. 返回 user_id (Firebase UID)            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   自动注册/更新用户                             │
│   - 检查数据库中是否存在该 UID                  │
│   - 不存在 → 创建新用户                        │
│   - 存在 → 更新 last_login_at                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   执行业务逻辑                                 │
│   - 使用 user_id 查询/更新数据                 │
│   - 扣减积分、创建任务等                        │
└─────────────────────────────────────────────┘
```

## 未来 App 开发

迁移到 Firebase Auth 后,开发 App 非常简单:

### React Native App

```typescript
// App.tsx
import auth from '@react-native-firebase/auth';
import axios from 'axios';

// 登录
const signIn = async () => {
  const { idToken } = await GoogleSignin.signIn();
  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);
};

// 调用 API
const callAPI = async () => {
  const token = await auth().currentUser?.getIdToken();

  const response = await axios.post(
    'https://your-api.com/api/tts',
    { text: 'Hello' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

### Flutter App

```dart
// 登录
final userCredential = await FirebaseAuth.instance.signInWithGoogle();

// 调用 API
final token = await FirebaseAuth.instance.currentUser?.getIdToken();
final response = await http.post(
  'https://your-api.com/api/tts',
  headers: {'Authorization': 'Bearer $token'},
  body: {'text': 'Hello'},
);
```

**关键优势**:
- Web 和 App 使用**完全相同的后端 API**
- **同一个用户 ID** 跨平台通用
- 用户在 Web 生成的语音,App 也能看到

## 常见问题 FAQ

### Q: 迁移后现有用户怎么办？
A: 可以让用户重新登录,或者手动迁移数据(在 Firebase Console 创建用户)。

### Q: Token 过期了怎么办？
A: Firebase SDK 自动刷新 token,Context 每 55 分钟刷新一次,无需手动处理。

### Q: Server Actions 怎么获取 token？
A: 通过 middleware 从 cookie 读取并添加到 header,Server Action 用 `headers()` 读取。

### Q: 匿名用户还支持吗？
A: 支持！未登录时自动降级到设备指纹匿名用户,逻辑不变。

### Q: 需要修改多少代码？
A: 主要修改:
1. Server Actions 导入改为 `auth-firebase.ts`
2. 登录页面用 `useFirebaseAuth()`
3. 添加 `FirebaseAuthProvider` 到根布局
4. 环境变量配置

## 回滚方案

如果迁移出现问题,可以快速回滚:

1. **恢复导入**:
```typescript
// 改回
import { getUserOrAnonymous } from '@/lib/auth';
```

2. **恢复登录逻辑** (使用之前的 Auth.js 组件)

3. **移除 FirebaseAuthProvider**

4. **删除新文件**:
   - `src/lib/auth-firebase.ts`
   - `src/contexts/FirebaseAuthContext.tsx`
   - `src/middleware.ts`

## 总结

迁移到 Firebase Auth 的主要好处:

1. ✅ **多端统一** - Web/iOS/Android 一套认证
2. ✅ **自动 Token 管理** - 不需要手动刷新
3. ✅ **丰富生态** - 推送、分析、深度链接等
4. ✅ **简化架构** - 不需要 Prisma Adapter
5. ✅ **App 开发友好** - 完美支持 React Native/Flutter

迁移步骤清晰,代码改动可控,是为未来 App 开发打下的坚实基础。