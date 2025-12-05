import type { Metadata } from "next";
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
  title: "Voicica AI - One Stop AI Solution for Video, Music, and Voiceover",
  description: "Everything you need for high-quality video with music and voiceover in one place. No technical skills required. Bring your best ideas to life on Voicica now.",
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
        <SpeedInsights />
      </body>
    </html>
  );
}
