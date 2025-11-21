# Apple Sign-In 配置指南

本文档介绍如何为 AI Voice Labs 项目配置 Apple Sign-In 功能。

## 前提条件

- Apple Developer 账号（需要付费订阅）
- Firebase 项目已创建
- 代码已经实现（✅ 已完成）

## 配置步骤

### 1. Apple Developer Portal 配置

#### 1.1 创建 App ID

1. 访问 [Apple Developer Portal](https://developer.apple.com/account)
2. 进入 **Certificates, Identifiers & Profiles**
3. 选择 **Identifiers** > 点击 **+** 按钮
4. 选择 **App IDs**，点击 **Continue**
5. 配置 App ID：
   - **Description**: AI Voice Labs
   - **Bundle ID**: 选择 **Explicit**，输入你的 Bundle ID（例如：`com.aivoicelabs.web`）
   - **Capabilities**: 勾选 **Sign in with Apple**
6. 点击 **Continue** 和 **Register**

#### 1.2 创建 Services ID（用于 Web）

1. 在 **Identifiers** 页面，点击 **+** 按钮
2. 选择 **Services IDs**，点击 **Continue**
3. 配置 Services ID：
   - **Description**: AI Voice Labs Web
   - **Identifier**: 输入唯一标识符（例如：`com.aivoicelabs.web.service`）
4. 点击 **Continue** 和 **Register**
5. 返回列表，点击刚创建的 Services ID
6. 勾选 **Sign in with Apple**
7. 点击 **Configure** 按钮：
   - **Primary App ID**: 选择步骤 1.1 创建的 App ID
   - **Website URLs**:
     - **Domains and Subdomains**: 添加你的域名（例如：`aivoicelabs.com`）
     - **Return URLs**: 添加 Firebase Auth 回调 URL（见下方第 2 步获取）
8. 点击 **Save** > **Continue** > **Save**

#### 1.3 创建 Key（用于服务器验证）

1. 在左侧菜单选择 **Keys**
2. 点击 **+** 按钮
3. 配置 Key：
   - **Key Name**: AI Voice Labs Apple Sign-In Key
   - 勾选 **Sign in with Apple**
   - 点击 **Configure**，选择步骤 1.1 创建的 App ID
4. 点击 **Continue** 和 **Register**
5. **下载 Key 文件（.p8）** - ⚠️ 只能下载一次，请妥善保存
6. 记录 **Key ID**（10 位字符）

### 2. Firebase Console 配置

#### 2.1 启用 Apple 登录提供商

1. 访问 [Firebase Console](https://console.firebase.google.com)
2. 选择你的项目
3. 进入 **Authentication** > **Sign-in method**
4. 点击 **Apple**，然后点击 **Enable**
5. 配置 Apple 登录：
   - **Services ID**: 输入步骤 1.2 创建的 Services ID（例如：`com.aivoicelabs.web.service`）
   - **Apple Team ID**: 在 Apple Developer Portal 右上角可以看到（10 位字符）
   - **Key ID**: 步骤 1.3 记录的 Key ID
   - **Private Key**: 打开步骤 1.3 下载的 .p8 文件，复制所有内容
6. 点击 **Save**

#### 2.2 获取回调 URL

在 Firebase Console 的 Apple 配置页面，会显示：
- **OAuth redirect URI**: 类似 `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`

将这个 URL 复制，返回 Apple Developer Portal 步骤 1.2，添加到 **Return URLs**。

### 3. 测试 Apple Sign-In

#### 3.1 本地测试（开发环境）

Apple Sign-In 在 localhost 无法直接测试，需要使用以下方法之一：

**方法 1: 使用 ngrok 创建临时域名**
```bash
# 安装 ngrok
npm install -g ngrok

# 启动应用
npm run dev

# 在另一个终端创建隧道
ngrok http 3000
```

将 ngrok 提供的 HTTPS URL 添加到 Apple Developer Portal 的 Return URLs。

**方法 2: 部署到 Vercel 测试**
```bash
# 部署到 Vercel
vercel --prod
```

使用 Vercel 提供的域名进行测试。

#### 3.2 测试步骤

1. 访问登录页面：`https://your-domain.com/login`
2. 点击 **Sign in with Apple** 按钮
3. 输入 Apple ID 和密码
4. 首次登录时，选择是否共享邮箱地址
5. 确认登录，应该会重定向到 `/studio/tts` 页面

#### 3.3 验证登录成功

登录成功后，在浏览器控制台应该看到：
```
✅ [FirebaseAuth] Apple 登录成功
✅ [FirebaseAuth] Token cookie 已设置
```

### 4. 生产环境配置

#### 4.1 更新域名配置

在 Apple Developer Portal 中：
1. 更新 Services ID 的 **Domains and Subdomains**
2. 更新 **Return URLs**，添加生产环境的 Firebase 回调 URL

#### 4.2 环境变量

确保生产环境的 Firebase 配置正确（在 Vercel 或其他平台设置）：
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. 故障排查

#### 常见错误

**错误 1: "invalid_client"**
- 原因：Services ID 配置错误
- 解决：检查 Services ID 是否正确填写在 Firebase Console

**错误 2: "redirect_uri_mismatch"**
- 原因：回调 URL 不匹配
- 解决：确保 Apple Developer Portal 的 Return URLs 包含 Firebase 的回调 URL

**错误 3: "unauthorized_client"**
- 原因：Key 配置错误或过期
- 解决：重新生成 Key，更新 Firebase Console 的 Private Key

**错误 4: "popup_closed_by_user"**
- 原因：用户关闭了弹窗
- 解决：这是正常行为，不需要处理

#### 调试方法

1. 打开浏览器开发者工具
2. 查看 Console 日志
3. 查看 Network 标签，检查认证请求
4. 在 Firebase Console > Authentication > Users 查看用户是否创建成功

## 代码说明

Apple 登录功能已在以下文件中实现：

### 前端代码
- **认证上下文**: `src/contexts/FirebaseAuthContext.tsx:128-139`
  - `signInWithApple()` 方法
  - 使用 `OAuthProvider('apple.com')`
  - 请求 `email` 和 `name` scope

- **登录 Hook**: `src/hooks/useLogin.ts:55-56`
  - 统一的 `handleLogin('apple')` 调用

- **登录表单**: `src/components/features/auth/LoginForm.tsx:61-68`
  - Apple 登录按钮
  - 支持国际化

### 功能特性
- ✅ 弹窗式登录
- ✅ 自动获取 Firebase ID Token
- ✅ Token 自动刷新（每 55 分钟）
- ✅ Cookie 管理（支持 HTTPS）
- ✅ 错误处理
- ✅ 加载状态
- ✅ 多语言支持

## 注意事项

1. **Apple Developer 账号必须付费**：Apple Sign-In 需要加入 Apple Developer Program（$99/年）

2. **域名要求**：
   - Apple Sign-In 不支持 localhost
   - 生产环境必须使用 HTTPS
   - 开发时需要使用 ngrok 或部署到测试环境

3. **隐私保护**：
   - 用户首次登录时可以选择隐藏真实邮箱
   - Apple 会生成私密邮箱（privaterelay@appleid.com）
   - 应用需要支持这种邮箱格式

4. **Token 管理**：
   - Firebase 自动处理 Apple ID Token 验证
   - 后端通过 Firebase Admin SDK 验证用户身份
   - 无需额外的服务器端 Apple 登录实现

## 参考资料

- [Apple Sign-In 官方文档](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Apple 登录指南](https://firebase.google.com/docs/auth/web/apple)
- [Apple Developer Portal](https://developer.apple.com/account)
- [Firebase Console](https://console.firebase.google.com)

---

**最后更新**: 2024
**状态**: ✅ 代码已实现，等待配置