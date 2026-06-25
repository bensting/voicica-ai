# Voicica — AI Voice & Creative Platform

[中文版](./README.zh-CN.md) · [Live Demo](https://voicica.ai) · [Google Play](https://play.google.com/store/apps/details?id=ai.voicica.app)

> A production-grade, full-stack AI creative platform — text-to-speech, voice cloning, AI image / music / video generation — deployed on Cloudflare Workers' global edge network and shipped as a cross-platform native app (Android & iOS).

---

## Screenshots

| Home (Native App) | TTS Studio |
|---|---|
| ![Home](./docs/home.png) | ![TTS](./docs/tts.png) |

---

## Features

### AI Creation Suite
- **Text-to-Speech** — 1,000+ voices across 40+ languages powered by Azure Cognitive Services, Google Cloud TTS, and Fish Audio
- **Voice Cloning** — Clone any voice from a short audio sample
- **AI Image Generation** — Generate and edit images via Google Gemini; one-click background removal and HD upscaling
- **AI Music Generation** — Create background tracks from text prompts
- **AI Video Generation** — Seedance 1.5 Pro via Kie.ai API
- **Dialogue Mode** — Compose multi-voice conversation scripts and export as audio

### Platform & Business
- **Cross-platform** — Single codebase runs as a Web app, PWA, and native Android / iOS (Capacitor)
- **12 UI languages** — EN, ZH-CN, ZH-TW, JA, KO, ES, FR, DE, AR, RU, PT, TH
- **Subscription & IAP** — Stripe (web) + Google Play Billing (Android) with webhook-driven credit system
- **Referral Program** — 3-tier affiliate system with real-time commission tracking
- **Token Economy** — $VOICICA mining rewards redeemable for USDT (Polygon / BEP20 / Solana)
- **Admin Dashboard** — Full back-office for user management, voice sync, push notifications, and app releases

### Infrastructure Highlights
- **Edge-deployed** on Cloudflare Workers via the OpenNext adapter — no cold starts, global low latency
- **Cloudflare D1** (SQLite at the edge) as the primary DB — self-migrated from Neon PostgreSQL using Drizzle ORM
- **Cloudflare R2** for media storage with client-side presigned-URL direct upload
- **Cloudflare Queue** for decoupled, async TTS job processing
- **Firebase** for auth (Google / Apple / email), FCM push notifications, and analytics
- **OTA updates** — Native WebView loads the live web URL; ship features without an app store release

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Drizzle ORM |
| Database | Cloudflare D1 (SQLite at the edge) |
| Storage | Cloudflare R2 |
| Compute | Cloudflare Workers (OpenNext) |
| Queue | Cloudflare Queues |
| Mobile | Capacitor (Android / iOS) |
| Auth | Firebase Authentication |
| Push | Firebase Cloud Messaging |
| Payments | Stripe · Google Play Billing |
| TTS providers | Azure Cognitive Services · Google Cloud TTS · Fish Audio |
| AI — Vision | Google Gemini |
| AI — Video | Kie.ai (Seedance 1.5 Pro) |
| AI — Moderation | OpenAI |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Client Layer                     │
│   Browser / PWA     Android (Capacitor)   iOS (Capacitor) │
└─────────────────────────┬────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────┐
│         Cloudflare Workers — Global Edge             │
│                                                      │
│  Next.js App (OpenNext)  ·  API Routes               │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  D1  DB  │  │ R2 Store │  │  Queue (TTS jobs)  │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│              External AI & Service APIs              │
│  Azure TTS · Google TTS · Fish Audio · Gemini · Kie  │
│  Stripe · Google Play · Firebase · Telegram          │
└──────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm i -g wrangler`
- Cloudflare account with D1, R2, and Queues enabled

### Local Development

```bash
git clone https://github.com/benshui08/ai-voice-labs-web.git
cd ai-voice-labs-web

npm install

cp .env.example .env.local
# Fill in the required values — see .env.example for the full list

npm run dev
```

### Key Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project config (client-side) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK service account key |
| `MICROSOFT_TTS_API_KEY` | Azure Cognitive Services key |
| `GOOGLE_API_KEY` | Google Cloud TTS key |
| `FISH_AUDIO_API_KEY` | Fish Audio key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `CLOUDFLARE_R2_*` | R2 bucket credentials |
| `ADMIN_PASSWORD` | Admin dashboard login password |

See [`.env.example`](.env.example) for the complete reference.

---

## Deployment

```bash
npm run build    # runs Drizzle migrations + Next.js build
wrangler deploy  # publishes to Cloudflare Workers
```

---

## Notable Engineering Decisions

**Edge-first migration** — Moved from Vercel + Neon PostgreSQL to Cloudflare Workers + D1. Rewrote 28-table schema from Drizzle PostgreSQL dialect to SQLite dialect and adapted 60+ async DB call sites. Result: zero cold starts and consistent sub-100 ms TTFB globally.

**Async TTS pipeline** — Audio synthesis can take 5–30 s. Jobs are enqueued to Cloudflare Queue and processed by a dedicated consumer Worker, keeping the main API response under 200 ms.

**Presigned direct upload** — Client uploads audio/image files directly to R2 via presigned URLs, bypassing the 25 MB Worker request body limit entirely.

**One codebase, three platforms** — Capacitor wraps the Next.js web app in a native shell. The shell loads from the live production URL, so feature updates ship instantly without an App Store / Play Store review cycle.

---

## License

MIT
