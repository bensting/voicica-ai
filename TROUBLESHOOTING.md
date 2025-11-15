# 手机端数据加载问题排查指南

## 问题描述
- ✅ 电脑浏览器正常
- ✅ 电脑浏览器模拟移动端正常
- ❌ 真实手机浏览器页面显示但数据不加载

## 诊断工具

访问 https://ai-voice-labs.com/api-test 查看配置状态

## 可能原因及解决方案

### 1. Vercel 环境变量未设置（最可能）

**检查步骤：**
1. 访问 https://vercel.com/dashboard
2. 选择项目 `ai-voice-labs-web`
3. Settings → Environment Variables

**必需的环境变量：**
```
NEXT_PUBLIC_API_BASE_URL=https://api.ai-voice-labs.com

NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=304429736257
NEXT_PUBLIC_FIREBASE_APP_ID=1:304429736257:web:6920219bfefb37203341c0
```

**⚠️ 重要：修改后必须 Redeploy**
- Deployments → 点击最新部署 → 右上角 "..." → Redeploy
- 或者推送新代码触发自动部署

### 2. Firebase 授权域名配置

**检查步骤：**
1. 访问 https://console.firebase.google.com
2. 选择项目 `your-project-id`
3. Authentication → Settings → Authorized domains

**必需的域名：**
- ✅ ai-voice-labs.com
- ✅ www.ai-voice-labs.com
- ✅ *.vercel.app（Vercel 预览部署）
- ✅ localhost（本地开发）

如果缺少 `ai-voice-labs.com`，点击 "Add domain" 添加。

### 3. 后端 CORS 配置

**检查后端是否允许跨域请求：**

在 Debian 服务器的 FastAPI 应用中，确认 CORS 配置：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-voice-labs.com",
        "https://www.ai-voice-labs.com",
        "https://*.vercel.app",  # Vercel 预览部署
        "http://localhost:3000",  # 本地开发
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**测试 CORS：**
```bash
curl -H "Origin: https://ai-voice-labs.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.ai-voice-labs.com/api/v1/health
```

应该看到响应头包含：
```
Access-Control-Allow-Origin: https://ai-voice-labs.com
Access-Control-Allow-Credentials: true
```

### 4. HTTPS 混合内容问题

**检查 API 地址必须是 HTTPS：**
- ❌ `http://api.ai-voice-labs.com`（会被浏览器阻止）
- ✅ `https://api.ai-voice-labs.com`

### 5. 网络请求日志检查

**手机浏览器调试：**

#### iPhone Safari
1. Settings → Safari → Advanced → Web Inspector (开启)
2. Mac 上打开 Safari → Develop → [你的 iPhone] → 选择页面
3. 查看 Console 和 Network 标签

#### Android Chrome
1. 手机开启开发者模式和 USB 调试
2. 电脑 Chrome 访问 `chrome://inspect`
3. 选择手机上的页面进行调试

**查找错误信息：**
- Console 中的红色错误
- Network 中失败的请求（状态码 0 或 CORS 错误）
- API 客户端的日志（以 🔑 📱 ❌ 开头）

## 快速修复流程

### 方案 A: 修复 Vercel 环境变量（最可能需要）

1. **设置环境变量：**
   - Vercel Dashboard → Settings → Environment Variables
   - 添加 `NEXT_PUBLIC_API_BASE_URL=https://api.ai-voice-labs.com`
   - 添加所有 Firebase 配置

2. **重新部署：**
   - Deployments → 最新部署 → Redeploy
   - 等待部署完成（约 1-2 分钟）

3. **验证：**
   - 手机访问 https://ai-voice-labs.com/api-test
   - 检查 API Base URL 是否正确
   - 点击"测试 API 连接"按钮

### 方案 B: 修复 Firebase 授权域名

1. Firebase Console → Authentication → Settings → Authorized domains
2. 添加 `ai-voice-labs.com`
3. 手机刷新页面重试

### 方案 C: 修复后端 CORS

1. SSH 登录 Debian 服务器
2. 编辑 FastAPI 应用的 CORS 配置
3. 添加 `https://ai-voice-labs.com` 到允许的来源
4. 重启后端服务：`systemctl restart your-api-service`

## 验证修复

修复后，按顺序验证：

1. **环境变量验证：**
   ```
   访问 https://ai-voice-labs.com/api-test
   确认 API Base URL 显示为绿色 ✅
   ```

2. **API 连接测试：**
   ```
   点击"测试 API 连接"按钮
   应该显示 ✅ 成功
   ```

3. **真实功能测试：**
   ```
   手机访问主页
   检查数据是否正常加载
   ```

## 仍然无法解决？

提供以下信息以便进一步诊断：

1. `/api-test` 页面显示的内容截图
2. 手机浏览器控制台的错误信息
3. Vercel 环境变量截图
4. 后端日志（是否收到请求）

## 相关文件

- 前端 API 客户端: `src/lib/api/client.ts`
- Firebase 配置: `src/lib/firebase.ts`
- Next.js 配置: `next.config.ts`
- 环境变量模板: `.env.example`