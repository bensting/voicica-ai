import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsContext";
import InstallPrompt from "@/components/features/pwa/InstallPrompt";
import PWAUpdatePrompt from "@/components/layout/PWAUpdatePrompt";
import LanguageLoadingWrapper from "@/components/providers/LanguageLoadingWrapper";
import DeviceFingerprintProvider from "@/components/providers/DeviceFingerprintProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Voice Labs - Create Stunning AI Voices",
  description: "Transform your content with natural-sounding AI voice generation. Create custom voice models with cutting-edge technology.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Voice Labs",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <FirebaseAuthProvider>
          <UserProvider>
            <CreditsProvider>
              <LanguageProvider>
                <LanguageLoadingWrapper>
                  <AudioSettingsProvider>
                    <DeviceFingerprintProvider />
                    {children}
                    <InstallPrompt />
                    <PWAUpdatePrompt />
                  </AudioSettingsProvider>
                </LanguageLoadingWrapper>
              </LanguageProvider>
            </CreditsProvider>
          </UserProvider>
        </FirebaseAuthProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
