import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsContext";
import PWAUpdatePrompt from "@/components/layout/PWAUpdatePrompt";
import AppUpdatePrompt from "@/components/native/AppUpdatePrompt";
import GooglePlayUpdatePrompt from "@/components/native/GooglePlayUpdatePrompt";
import LanguageLoadingWrapper from "@/components/providers/LanguageLoadingWrapper";
import DeviceFingerprintProvider from "@/components/providers/DeviceFingerprintProvider";
import CapacitorProvider from "@/components/providers/CapacitorProvider";
import ServerActionErrorHandler from "@/components/providers/ServerActionErrorHandler";
import AccountLinkingModal from "@/components/features/auth/AccountLinkingModal";
import { AdMobProvider } from "@/contexts/AdMobContext";

// 支持的语言列表
const SUPPORTED_LOCALES = [
  'en-US', 'zh-CN', 'zh-TW', 'th-TH',
  'ja-JP', 'es-ES', 'pt-BR', 'ar-SA',
  'hi-IN', 'vi-VN', 'id-ID', 'my-MM'
] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// 多语言 SEO 配置
const SEO_CONFIG: Record<Locale, {
  title: string;
  description: string;
  keywords: string[];
  ogLocale: string;
}> = {
  'en-US': {
    title: "Voicica AI - All-in-One Platform for Voice, Music & Videos - 100% Free!",
    description: "Free AI platform for text to speech, music generation, and video creation. 3200+ natural voices in 190+ languages. Create professional content instantly. No signup required.",
    keywords: ["text to speech", "AI voice generator", "AI music", "AI video", "free TTS", "voiceover", "text to voice", "AI voiceover", "speech synthesis"],
    ogLocale: "en_US",
  },
  'zh-CN': {
    title: "Voicica AI - 语音、音乐、视频一站式AI平台 - 100%免费！",
    description: "免费AI平台，支持文字转语音、AI音乐生成、AI视频创作。3200+自然语音，190+种语言。即刻生成专业内容，无需注册。",
    keywords: ["文字转语音", "AI配音", "AI音乐", "AI视频", "免费TTS", "语音合成", "AI语音生成器", "在线配音"],
    ogLocale: "zh_CN",
  },
  'zh-TW': {
    title: "Voicica AI - 語音、音樂、影片一站式AI平台 - 100%免費！",
    description: "免費AI平台，支援文字轉語音、AI音樂生成、AI影片創作。3200+自然語音，190+種語言。即刻生成專業內容，無需註冊。",
    keywords: ["文字轉語音", "AI配音", "AI音樂", "AI影片", "免費TTS", "語音合成", "AI語音生成器", "線上配音"],
    ogLocale: "zh_TW",
  },
  'th-TH': {
    title: "Voicica AI - แพลตฟอร์ม AI ครบวงจร เสียง เพลง วิดีโอ - ฟรี 100%!",
    description: "แพลตฟอร์ม AI ฟรี สำหรับแปลงข้อความเป็นเสียง สร้างเพลง AI และสร้างวิดีโอ AI มีเสียงธรรมชาติกว่า 3200 เสียง รองรับ 190+ ภาษา สร้างคอนเทนต์ระดับมืออาชีพได้ทันที ไม่ต้องสมัคร",
    keywords: ["แปลงข้อความเป็นเสียง", "AI พากย์เสียง", "AI เพลง", "AI วิดีโอ", "TTS ฟรี", "สร้างเสียงพากย์", "AI สังเคราะห์เสียง", "text to speech ไทย"],
    ogLocale: "th_TH",
  },
  'ja-JP': {
    title: "Voicica AI - 音声・音楽・動画のオールインワンAIプラットフォーム - 100%無料！",
    description: "無料AIプラットフォーム。テキスト読み上げ、AI音楽生成、AI動画作成に対応。3200以上の自然な音声、190以上の言語をサポート。登録不要で即座にプロ品質のコンテンツを作成。",
    keywords: ["テキスト読み上げ", "AI音声", "AI音楽", "AI動画", "無料TTS", "音声合成", "AIナレーション", "text to speech 日本語"],
    ogLocale: "ja_JP",
  },
  'es-ES': {
    title: "Voicica AI - Plataforma Todo en Uno para Voz, Música y Videos - ¡100% Gratis!",
    description: "Plataforma AI gratuita para texto a voz, generación de música AI y creación de videos AI. Más de 3200 voces naturales en más de 190 idiomas. Crea contenido profesional al instante sin registro.",
    keywords: ["texto a voz", "voz AI", "música AI", "video AI", "TTS gratis", "síntesis de voz", "narración AI", "text to speech español"],
    ogLocale: "es_ES",
  },
  'pt-BR': {
    title: "Voicica AI - Plataforma Tudo-em-Um para Voz, Música e Vídeos - 100% Grátis!",
    description: "Plataforma AI gratuita para texto para fala, geração de música AI e criação de vídeos AI. Mais de 3200 vozes naturais em mais de 190 idiomas. Crie conteúdo profissional instantaneamente sem cadastro.",
    keywords: ["texto para fala", "voz AI", "música AI", "vídeo AI", "TTS grátis", "síntese de voz", "narração AI", "text to speech português"],
    ogLocale: "pt_BR",
  },
  'ar-SA': {
    title: "Voicica AI - منصة شاملة للصوت والموسيقى والفيديو - مجاني 100%!",
    description: "منصة ذكاء اصطناعي مجانية لتحويل النص إلى كلام وإنشاء الموسيقى والفيديو. أكثر من 3200 صوت طبيعي بأكثر من 190 لغة. أنشئ محتوى احترافي فوراً بدون تسجيل.",
    keywords: ["تحويل النص إلى كلام", "صوت AI", "موسيقى AI", "فيديو AI", "TTS مجاني", "توليف الصوت", "التعليق الصوتي AI"],
    ogLocale: "ar_SA",
  },
  'hi-IN': {
    title: "Voicica AI - आवाज़, संगीत और वीडियो के लिए ऑल-इन-वन AI प्लेटफ़ॉर्म - 100% मुफ़्त!",
    description: "टेक्स्ट टू स्पीच, AI संगीत निर्माण और AI वीडियो निर्माण के लिए मुफ़्त AI प्लेटफ़ॉर्म। 190+ भाषाओं में 3200+ प्राकृतिक आवाज़ें। बिना साइनअप के तुरंत पेशेवर कंटेंट बनाएं।",
    keywords: ["टेक्स्ट टू स्पीच", "AI आवाज़", "AI संगीत", "AI वीडियो", "मुफ़्त TTS", "वॉइस सिंथेसिस", "AI नैरेशन", "text to speech हिंदी"],
    ogLocale: "hi_IN",
  },
  'vi-VN': {
    title: "Voicica AI - Nền tảng AI Tất cả trong Một cho Giọng nói, Âm nhạc & Video - Miễn phí 100%!",
    description: "Nền tảng AI miễn phí cho chuyển văn bản thành giọng nói, tạo nhạc AI và tạo video AI. Hơn 3200 giọng tự nhiên trong hơn 190 ngôn ngữ. Tạo nội dung chuyên nghiệp ngay lập tức không cần đăng ký.",
    keywords: ["chuyển văn bản thành giọng nói", "giọng AI", "nhạc AI", "video AI", "TTS miễn phí", "tổng hợp giọng nói", "thuyết minh AI", "text to speech tiếng Việt"],
    ogLocale: "vi_VN",
  },
  'id-ID': {
    title: "Voicica AI - Platform AI All-in-One untuk Suara, Musik & Video - 100% Gratis!",
    description: "Platform AI gratis untuk text to speech, pembuatan musik AI, dan pembuatan video AI. 3200+ suara alami dalam 190+ bahasa. Buat konten profesional secara instan tanpa daftar.",
    keywords: ["text to speech", "suara AI", "musik AI", "video AI", "TTS gratis", "sintesis suara", "narasi AI", "text to speech Indonesia"],
    ogLocale: "id_ID",
  },
  'my-MM': {
    title: "Voicica AI - အသံ၊ ဂီတနှင့် ဗီဒီယိုအတွက် All-in-One AI Platform - 100% အခမဲ့!",
    description: "စာသားမှအသံပြောင်းခြင်း၊ AI ဂီတဖန်တီးခြင်းနှင့် AI ဗီဒီယိုဖန်တီးခြင်းအတွက် အခမဲ့ AI platform။ ဘာသာစကား 190+ တွင် သဘာဝအသံ 3200+ ရှိသည်။ စာရင်းသွင်းရန်မလိုဘဲ ပရော်ဖက်ရှင်နယ် content ချက်ချင်းဖန်တီးပါ။",
    keywords: ["text to speech", "AI အသံ", "AI ဂီတ", "AI ဗီဒီယို", "အခမဲ့ TTS", "အသံပေါင်းစပ်ခြင်း", "AI ဇာတ်ကြောင်း"],
    ogLocale: "my_MM",
  },
};

// 动态生成 metadata
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const locale = (
    localeCookie && SUPPORTED_LOCALES.includes(localeCookie as Locale)
      ? localeCookie
      : 'en-US'
  ) as Locale;

  const seo = SEO_CONFIG[locale];

  return {
    // 基础 SEO
    title: {
      default: seo.title,
      template: "%s | Voicica AI",
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "Voicica AI" }],
    creator: "Voicica AI",
    publisher: "Voicica AI",

    // Open Graph (社交分享)
    openGraph: {
      type: "website",
      locale: seo.ogLocale,
      url: "https://voicica.ai",
      siteName: "Voicica AI",
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: "https://voicica.ai/og-image.png",
          width: 1200,
          height: 630,
          alt: "Voicica AI - Free Text to Speech",
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: ["https://voicica.ai/og-image.png"],
    },

    // 搜索引擎指令
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // 其他
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Voicica AI",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/icons/icon-192x192.png",
    },
    // Google AdSense 验证
    other: {
      "google-adsense-account": "ca-pub-5946279989031789",
    },
    // 备用语言链接（帮助 Google 理解多语言网站）
    alternates: {
      canonical: "https://voicica.ai",
      languages: {
        "en-US": "https://voicica.ai",
        "zh-CN": "https://voicica.ai",
        "zh-TW": "https://voicica.ai",
        "th-TH": "https://voicica.ai",
        "ja-JP": "https://voicica.ai",
        "es-ES": "https://voicica.ai",
        "pt-BR": "https://voicica.ai",
        "ar-SA": "https://voicica.ai",
        "hi-IN": "https://voicica.ai",
        "vi-VN": "https://voicica.ai",
        "id-ID": "https://voicica.ai",
        "my-MM": "https://voicica.ai",
      },
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9333ea",
  viewportFit: "cover", // 启用安全区域支持
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从 cookie 读取语言设置（middleware 已设置）
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const initialLocale = (
    localeCookie && SUPPORTED_LOCALES.includes(localeCookie as Locale)
      ? localeCookie
      : 'en-US'
  ) as Locale;

  return (
    <html lang={initialLocale.split('-')[0]} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider initialLocale={initialLocale}>
          <FirebaseAuthProvider>
            <LanguageLoadingWrapper>
              <UserProvider>
                <CreditsProvider>
                  <SubscriptionProvider>
                    <AudioSettingsProvider>
                      <DeviceFingerprintProvider>
                        <AdMobProvider>
                          <CapacitorProvider />
                          {children}
                          <PWAUpdatePrompt />
                          <AppUpdatePrompt />
                          <GooglePlayUpdatePrompt />
                          <ServerActionErrorHandler />
                          <AccountLinkingModal />
                        </AdMobProvider>
                      </DeviceFingerprintProvider>
                    </AudioSettingsProvider>
                  </SubscriptionProvider>
                </CreditsProvider>
              </UserProvider>
            </LanguageLoadingWrapper>
          </FirebaseAuthProvider>
        </LanguageProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5946279989031789"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
}
