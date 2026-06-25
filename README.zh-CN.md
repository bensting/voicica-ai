# Voicica — AI 语音与创作平台

[English](./README.md) · [在线体验](https://voicica.ai) · [Google Play 下载](https://play.google.com/store/apps/details?id=ai.voicica.app)

> 一个生产级全栈 AI 创作平台，支持文字转语音、声音克隆、AI 图像 / 音乐 / 视频生成，部署在 Cloudflare Workers 全球边缘网络，同时以 Android & iOS 原生 App 形式发布。

---

## 截图

| 首页（原生 App） | TTS 创作页 |
|---|---|
| ![首页](./docs/home.png) | ![TTS](./docs/tts.png) |

---

## 功能

### AI 创作套件
- **文字转语音** — 对接 Azure、Google Cloud TTS、Fish Audio 三大引擎，覆盖 40+ 语言、1000+ 声音
- **声音克隆** — 上传短音频，克隆任意声线
- **AI 图像生成** — 基于 Google Gemini 的图像生成与编辑；一键抠图、HD 超分辨率放大
- **AI 音乐生成** — 文字描述生成背景音乐
- **AI 视频生成** — 接入 Kie.ai Seedance 1.5 Pro 模型
- **对话配音** — 多角色对话脚本配音，支持批量导出

### 平台与商业化
- **多平台** — 同一套代码跑 Web、PWA、Android / iOS（Capacitor）
- **12 种 UI 语言** — 英、简中、繁中、日、韩、西、法、德、阿、俄、葡、泰
- **订阅 & 内购** — Stripe（Web 端）+ Google Play Billing（Android 端），Webhook 驱动积分系统
- **推荐裂变** — 三级分销体系，实时佣金结算
- **挖矿经济** — $VOICICA 代币奖励机制，支持 USDT 提现（Polygon / BEP20 / Solana）
- **管理后台** — 用户管理、语音同步、推送通知、App 版本发布的全功能控制台

### 基础设施
- 基于 **Cloudflare Workers** + OpenNext 适配器做边缘部署，全球零冷启动
- **Cloudflare D1**（边缘 SQLite）作主数据库 — 从 Neon PostgreSQL 自主完成迁移
- **Cloudflare R2** 存储媒体文件，客户端通过预签名 URL 直传，绕过 Worker 25 MB 限制
- **Cloudflare Queue** 实现 TTS 任务异步解耦
- **Firebase** 负责多方式登录（Google / Apple / 邮箱）、FCM 推送、Analytics
- **OTA 热更新** — 原生 App 的 WebView 加载线上地址，功能更新无需过审

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| ORM | Drizzle ORM |
| 数据库 | Cloudflare D1（边缘 SQLite） |
| 存储 | Cloudflare R2 |
| 计算 | Cloudflare Workers（OpenNext） |
| 队列 | Cloudflare Queues |
| 移动端 | Capacitor（Android / iOS） |
| 认证 | Firebase Authentication |
| 推送 | Firebase Cloud Messaging |
| 支付 | Stripe · Google Play Billing |
| TTS 引擎 | Azure Cognitive Services · Google Cloud TTS · Fish Audio |
| AI 视觉 | Google Gemini |
| AI 视频 | Kie.ai（Seedance 1.5 Pro） |
| AI 审核 | OpenAI |

---

## 架构总览

```
┌──────────────────────────────────────────────────────┐
│                      客户端层                        │
│   浏览器 / PWA      Android（Capacitor）  iOS（Capacitor）│
└─────────────────────────┬────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────┐
│          Cloudflare Workers — 全球边缘节点            │
│                                                      │
│   Next.js App（OpenNext）·  API Routes               │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  D1 数据库│  │ R2 存储  │  │  Queue（TTS 任务） │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│                外部 AI 与第三方服务                   │
│  Azure TTS · Google TTS · Fish Audio · Gemini · Kie  │
│  Stripe · Google Play · Firebase · Telegram          │
└──────────────────────────────────────────────────────┘
```

---

## 快速开始

### 环境要求

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm i -g wrangler`
- Cloudflare 账户（开启 D1、R2、Queues）

### 本地开发

```bash
git clone https://github.com/benshui08/ai-voice-labs-web.git
cd ai-voice-labs-web

npm install

cp .env.example .env.local
# 按照 .env.example 中的说明填写各项配置

npm run dev
```

### 关键环境变量

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 项目配置（客户端） |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK 服务账号私钥 |
| `MICROSOFT_TTS_API_KEY` | Azure 语音服务密钥 |
| `GOOGLE_API_KEY` | Google Cloud TTS 密钥 |
| `FISH_AUDIO_API_KEY` | Fish Audio 密钥 |
| `STRIPE_SECRET_KEY` | Stripe 密钥 |
| `CLOUDFLARE_R2_*` | R2 存储凭证 |
| `ADMIN_PASSWORD` | 管理后台登录密码 |

完整列表见 [`.env.example`](.env.example)。

---

## 部署

```bash
npm run build    # 执行 Drizzle 迁移 + Next.js 构建
wrangler deploy  # 发布到 Cloudflare Workers
```

---

## 关键工程决策

**边缘优先迁移** — 从 Vercel + Neon PostgreSQL 迁移至 Cloudflare Workers + D1。将 28 张表的 Drizzle Schema 从 PostgreSQL 方言改写为 SQLite 方言，并适配 60+ 处异步 DB 调用。结果：零冷启动，全球 TTFB 稳定在 100 ms 以内。

**TTS 异步队列** — 音频合成耗时 5–30 秒。任务入队 Cloudflare Queue，由独立 Consumer Worker 消费，主 API 响应始终在 200 ms 以内。

**预签名直传** — 客户端通过预签名 URL 直接向 R2 上传文件，完全绕开 Worker 25 MB 请求体限制。

**一套代码，三端发布** — Capacitor 将 Next.js Web App 包装为原生 Shell，Shell 加载线上生产地址。新功能上线即生效，无需经过 App Store / Google Play 审核周期。

---

## License

MIT
