import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsContext";
import PWAUpdatePrompt from "@/components/layout/PWAUpdatePrompt";
import AppUpdatePrompt from "@/components/native/AppUpdatePrompt";
import LanguageLoadingWrapper from "@/components/providers/LanguageLoadingWrapper";
import DeviceFingerprintProvider from "@/components/providers/DeviceFingerprintProvider";
import CapacitorProvider from "@/components/providers/CapacitorProvider";
import ServerActionErrorHandler from "@/components/providers/ServerActionErrorHandler";

// 支持的语言列表
const SUPPORTED_LOCALES = ['en-US', 'zh-CN', 'zh-TW', 'th-TH'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 多语言 SEO 配置
const SEO_CONFIG: Record<Locale, {
  title: string;
  description: string;
  keywords: string[];
  ogLocale: string;
}> = {
  'en-US': {
    title: "Voicica AI - Free AI Text to Speech Online | 3000+ Voices",
    description: "Free AI text to speech generator with 3000+ natural voices in 40+ languages. Create professional voiceovers instantly. No signup required. 100% free.",
    keywords: ["text to speech", "AI voice generator", "free TTS", "voiceover", "text to voice", "AI voiceover", "speech synthesis"],
    ogLocale: "en_US",
  },
  'zh-CN': {
    title: "Voicica AI - 免费AI文字转语音 | 3000+语音",
    description: "免费AI配音生成器，3000+自然语音，支持40+种语言。只需输入文字，即刻生成专业配音。无需注册，100%免费。",
    keywords: ["文字转语音", "AI配音", "免费TTS", "语音合成", "AI语音生成器", "在线配音"],
    ogLocale: "zh_CN",
  },
  'zh-TW': {
    title: "Voicica AI - 免費AI文字轉語音 | 3000+語音",
    description: "免費AI配音生成器，3000+自然語音，支援40+種語言。只需輸入文字，即刻生成專業配音。無需註冊，100%免費。",
    keywords: ["文字轉語音", "AI配音", "免費TTS", "語音合成", "AI語音生成器", "線上配音"],
    ogLocale: "zh_TW",
  },
  'th-TH': {
    title: "Voicica AI - แปลงข้อความเป็นเสียงฟรี | เสียง 3000+",
    description: "เครื่องมือสร้างเสียงพากย์ AI ฟรี มีเสียงธรรมชาติกว่า 3000 เสียง รองรับ 40+ ภาษา แค่พิมพ์ข้อความก็สร้างเสียงพากย์ระดับมืออาชีพได้ทันที ไม่ต้องสมัคร ฟรี 100%",
    keywords: ["แปลงข้อความเป็นเสียง", "AI พากย์เสียง", "TTS ฟรี", "สร้างเสียงพากย์", "AI สังเคราะห์เสียง", "text to speech ไทย"],
    ogLocale: "th_TH",
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
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
    // Google AdSense 验证
    other: {
      "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
    },
    // 备用语言链接（帮助 Google 理解多语言网站）
    alternates: {
      canonical: "https://voicica.ai",
      languages: {
        "en-US": "https://voicica.ai",
        "zh-CN": "https://voicica.ai",
        "zh-TW": "https://voicica.ai",
        "th-TH": "https://voicica.ai",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider initialLocale={initialLocale}>
          <FirebaseAuthProvider>
            <LanguageLoadingWrapper>
              <UserProvider>
                <CreditsProvider>
                  <AudioSettingsProvider>
                    <DeviceFingerprintProvider />
                    <CapacitorProvider />
                    {children}
                    <PWAUpdatePrompt />
                    <AppUpdatePrompt />
                    <ServerActionErrorHandler />
                  </AudioSettingsProvider>
                </CreditsProvider>
              </UserProvider>
            </LanguageLoadingWrapper>
          </FirebaseAuthProvider>
        </LanguageProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {/* Google AdSense */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
}
