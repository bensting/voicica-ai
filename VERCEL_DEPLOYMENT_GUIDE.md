# Vercel 部署配置指南

本文档说明如何正确配置 Vercel 环境变量,解决生产环境 500 错误。

## 问题背景

生产环境中访问 `/studio/generation-history` 和 `/studio/tts` 页面时出现 500 Internal Server Error,原因是:

1. **Firebase Admin SDK 环境变量未配置** - 导致服务端无法验证 Firebase ID Token
2. **设备指纹 Cookie 未初始化** - 导致匿名用户认证失败

## 必需的环境变量

### 1. Firebase Admin SDK 配置

在 Vercel Dashboard 中设置以下环境变量:

#### `FIREBASE_ADMIN_PROJECT_ID`
```
ai-voice-labs-473713
```
**说明**: Firebase 项目 ID,直接复制即可,不需要引号。

#### `FIREBASE_ADMIN_CLIENT_EMAIL`
```
firebase-adminsdk-fbsvc@ai-voice-labs-473713.iam.gserviceaccount.com
```
**说明**: Firebase Admin 服务账号邮箱,不需要引号。

#### `FIREBASE_ADMIN_PRIVATE_KEY`
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQI...(省略)...fJkg==\n-----END PRIVATE KEY-----\n"
```

**⚠️ 重要**:
- **必须包含外层双引号** `"..."`
- 保持 `\n` 转义序列不变 (不要替换为实际换行)
- 完整格式示例:
  ```
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BA...(私钥内容)...\n-----END PRIVATE KEY-----\n"
  ```

**为什么需要引号?**
- Vercel 环境变量中,`\n` 需要被解析为换行符
- 不加引号时,`\n` 会被当作普通字符串,导致私钥格式错误
- 加引号后,Vercel 会正确解析 `\n` 为换行符

### 2. 其他必需环境变量

确保以下环境变量也已配置 (通常已配置):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 配置步骤

### 1. 登录 Vercel Dashboard

访问: https://vercel.com/dashboard

### 2. 进入项目设置

1. 选择你的项目 (ai-voices-labs-web)
2. 点击 **Settings** 标签
3. 选择左侧菜单的 **Environment Variables**

### 3. 添加环境变量

对于每个环境变量:

1. 点击 **Add New**
2. 输入 **Key** (变量名,例如 `FIREBASE_ADMIN_PRIVATE_KEY`)
3. 输入 **Value** (变量值,**注意私钥要加引号**)
4. 选择环境:
   - ✅ **Production** (生产环境,必选)
   - ✅ **Preview** (预览环境,推荐)
   - ✅ **Development** (开发环境,可选)
5. 点击 **Save**

### 4. 重新部署

**⚠️ 关键步骤**: 添加/修改环境变量后,**必须重新部署**才能生效!

方法1: 在 Vercel Dashboard 中
1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 确认 **Redeploy**

方法2: 通过 Git 提交触发部署
```bash
git commit --allow-empty -m "chore: trigger Vercel redeploy"
git push origin main
```

## 代码修复

以下代码已修复 (无需手动操作):

### 1. 设备指纹初始化

**新增**: `src/components/providers/DeviceFingerprintProvider.tsx`
- 自动生成设备指纹并设置到 cookie
- 支持匿名用户访问 API

**修改**: `src/app/layout.tsx`
- 添加 `DeviceFingerprintProvider` 到根布局
- 添加 `CreditsProvider` 到根布局

### 2. Next.js 15 headers() 使用规范

**修改**: `src/lib/auth-firebase.ts`
- 修复 `headers()` 调用位置,确保符合 Next.js 15 生产环境要求
- `getUserOrAnonymous()` 在函数顶层调用 `headers()`
- `verifyFirebaseToken()` 接收 headers 作为参数

## 验证部署

部署完成后,访问以下页面验证:

1. **首页**: https://www.ai-voice-labs.com/
   - 未登录状态下应该能正常访问
   - 检查浏览器 Console 是否有 "设备指纹已设置到 cookie" 日志

2. **登录并访问 TTS 页面**: https://www.ai-voice-labs.com/studio/tts
   - 登录后应该能正常访问
   - 检查是否显示积分余额
   - 检查浏览器 Console 是否有 Firebase 相关错误

3. **生成历史页面**: https://www.ai-voice-labs.com/studio/generation-history
   - 应该能正常加载历史记录
   - 不应该出现 500 错误

## 常见问题

### Q1: 添加环境变量后仍然报错?

**A**: 确保已重新部署。环境变量只在构建时注入,修改后必须触发新的部署。

### Q2: 私钥格式错误?

**A**: 检查以下几点:
- 是否包含外层双引号 `"..."`
- `\n` 是否保持为转义序列 (不要替换为实际换行)
- 是否完整复制了 `-----BEGIN PRIVATE KEY-----` 到 `-----END PRIVATE KEY-----` 的所有内容

### Q3: 本地运行正常,生产环境报错?

**A**: Next.js 15 在 Vercel 生产环境对 `headers()` 调用有严格限制,必须在 Server Action 顶层调用。本次代码修复已解决此问题。

### Q4: 匿名用户无法访问?

**A**: 确保 `DeviceFingerprintProvider` 已添加到根布局,并检查浏览器 Console 是否有设备指纹相关日志。

## 技术说明

### 为什么生产环境需要引号,本地不需要?

**本地 `.env.local` 文件**:
- Node.js 直接读取文件内容
- `\n` 在文件中就是两个字符 `\` 和 `n`
- `replace(/\\n/g, '\n')` 将其转换为换行符

**Vercel 环境变量**:
- 通过 Web UI 输入,作为字符串存储
- 不加引号: `\n` 被当作普通字符,不会被解析
- 加引号: Vercel 解析转义序列,`\n` 转换为换行符
- 然后 `replace(/\\n/g, '\n')` 再次处理 (因为 Vercel 可能保留了转义)

### middleware.ts 工作原理

1. 读取 `firebase-token` cookie (由 `FirebaseAuthContext` 设置)
2. 读取 `device-fingerprint` cookie (由 `DeviceFingerprintProvider` 设置)
3. 将两者添加到 request headers
4. Server Actions 通过 `headers()` 读取这些 headers
5. `getUserOrAnonymous()` 优先验证 Firebase token,失败时降级到设备指纹

## 需要帮助?

如果配置后仍有问题,请提供:
1. Vercel 部署日志
2. 浏览器 Console 错误信息
3. 访问的 URL 和具体操作步骤

---

**最后更新**: 2024
**相关文件**:
- `src/lib/auth-firebase.ts`
- `src/lib/firebase-admin.ts`
- `src/components/providers/DeviceFingerprintProvider.tsx`
- `src/middleware.ts`