import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
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

export const metadata: Metadata = {

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
