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

// Static English SEO metadata
export const metadata: Metadata = {
  title: {
    default: "Voicica AI - Free AI Voice Generator, Music & Image Creator",
    template: "%s | Voicica AI",
  },
  description:
    "Free AI platform: text to speech with 3200+ voices, AI music generator, AI image creator, video downloader, HD upscaler, and background remover. Create professional content instantly — no signup required.",
  keywords: [
    "text to speech",
    "AI voice generator",
    "free text to speech online",
    "AI voice generator free",
    "text to voice",
    "AI music generator",
    "AI image generator",
    "AI image creator",
    "free video downloader",
    "TikTok video downloader",
    "YouTube video downloader",
    "HD image upscaler",
    "background remover",
    "AI voiceover",
    "speech synthesis",
    "free TTS",
    "online voice generator",
  ],
  authors: [{ name: "Voicica AI" }],
  creator: "Voicica AI",
  publisher: "Voicica AI",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://voicica.ai",
    siteName: "Voicica AI",
    title: "Voicica AI - Free AI Voice Generator, Music & Image Creator",
    description:
      "Free AI platform: text to speech with 3200+ voices, AI music generator, AI image creator, video downloader, HD upscaler, and background remover.",
    images: [
      {
        url: "https://voicica.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Voicica AI - Free AI Voice Generator",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Voicica AI - Free AI Voice Generator, Music & Image Creator",
    description:
      "Free AI platform: text to speech with 3200+ voices, AI music generator, AI image creator, video downloader, HD upscaler, and background remover.",
    images: ["https://voicica.ai/og-image.png"],
  },

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
  other: {
    "google-adsense-account": "ca-pub-5946279989031789",
  },
  alternates: {
    canonical: "https://voicica.ai",
  },
};

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
        {/* Microsoft UET (Bing Ads) */}
        <Script
          id="microsoft-uet"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,t,u,o){w[u]=w[u]||[],o.ts=(new Date).getTime();var n=d.createElement(t);n.src="https://bat.bing.net/bat.js?ti="+o.ti+("uetq"!=u?"&q="+u:""),n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&"loaded"!==s&&"complete"!==s||(o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad"),n.onload=n.onreadystatechange=null)};var i=d.getElementsByTagName(t)[0];i.parentNode.insertBefore(n,i)})(window,document,"script","uetq",{ti:"343232821",enableAutoSpaTracking:true});window.uetq=window.uetq||[];window.uetq.push("consent","default",{"ad_storage":"granted"});`,
          }}
        />
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
}
