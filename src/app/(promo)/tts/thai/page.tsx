'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';

// Thai language TTS landing page - Mobile-first single page design
// เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี ภาษาไทย

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';
const WEB_APP_URL = '/studio/tts';

export default function ThaiTTSPage() {
  // 检测是否为 Android 设备
  const handleCTAClick = useCallback(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = PLAY_STORE_URL;
    } else {
      window.location.href = WEB_APP_URL;
    }
  }, []);
  return (
    <div
      className="h-[100dvh] bg-cover bg-center bg-no-repeat flex flex-col overflow-hidden"
      style={{ backgroundImage: 'url(/images/tts-bg.webp)' }}
    >
      {/* Overlay for better text readability */}
      <div className="flex-1 flex flex-col bg-black/30 overflow-hidden">
        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-6 text-center min-h-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-2 sm:mb-4">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs sm:text-sm">ฟรี 100% • ไม่ต้องสมัคร</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-3">
            <span className="text-white">AI </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              แปลงข้อความเป็นเสียง
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-lime-400">ฟรี</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-200 text-xs sm:text-base mb-3 sm:mb-6">
            เสียงสมจริง • ใช้งานได้ทันที • ไม่จำกัด
          </p>

          {/* CTA Button - Purple gradient with white border and glow */}
          {/* Android → Play Store, Others → Web App */}
          <button
            onClick={handleCTAClick}
            className="relative inline-flex items-center gap-2 px-8 py-3 sm:px-10 sm:py-4 text-white font-bold rounded-full text-lg sm:text-xl transition-all mb-2 sm:mb-4 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 50%, #7c3aed 100%)',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
            }}
          >
            เริ่มใช้งานฟรี
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* User count */}
          <p className="text-gray-400 text-[10px] sm:text-xs mb-2 sm:mb-4">
            ผู้ใช้กว่า 10,000+ คน ทั่วโลกใช้แล้ว
          </p>

          {/* Phone Mockup Section */}
          <div className="relative w-full max-w-xs sm:max-w-sm mx-auto mb-2 sm:mb-4 flex-shrink">
            {/* Left decoration */}
            <div className="absolute left-0 top-1/4 -translate-x-1 sm:-translate-x-8">
              <span className="text-yellow-400 text-xl sm:text-3xl font-bold" style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}>
                ฟรี
              </span>
            </div>

            {/* Right decoration */}
            <div className="absolute right-0 top-1/3 translate-x-1 sm:translate-x-8">
              <span className="text-purple-400 text-sm sm:text-xl font-semibold italic" style={{ textShadow: '0 0 20px rgba(192, 132, 252, 0.5)' }}>
                No Limits!
              </span>
            </div>

            {/* Phone Image - Smaller on mobile */}
            <div className="relative mx-auto w-32 sm:w-56 lg:w-64">
              <Image
                src="/images/tts-app-mockup.png"
                alt="Voicica App - Voice Selection"
                width={256}
                height={512}
                className="w-full h-auto drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Stats - More compact on mobile */}
          <div className="flex items-center justify-center gap-3 sm:gap-8 mb-2 sm:mb-4">
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">3,200+</div>
              <div className="text-[10px] sm:text-sm text-gray-400">เสียง</div>
            </div>
            <div className="w-px h-6 sm:h-10 bg-gray-600" />
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">192+</div>
              <div className="text-[10px] sm:text-sm text-gray-400">ภาษา</div>
            </div>
            <div className="w-px h-6 sm:h-10 bg-gray-600" />
            <div className="text-center">
              <div className="flex items-center gap-0.5 sm:gap-1 text-green-400">
                <svg className="w-4 h-4 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-base sm:text-2xl font-bold">ฟรี</span>
                <span className="text-xs sm:text-lg font-medium">ไม่จำกัด</span>
              </div>
              <div className="text-[10px] sm:text-sm text-gray-400">ราคาคนแทนต์</div>
            </div>
          </div>

          {/* Feature links */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-gray-400 text-[10px] sm:text-sm">
            <span>ทำวิดีโอ</span>
            <span className="text-gray-600">|</span>
            <span>พากย์เสียง</span>
            <span className="text-gray-600">|</span>
            <span>ทำคอนเทนต์</span>
          </div>
        </div>

        {/* App Store Buttons - Fixed at bottom on mobile */}
        <div className="flex-shrink-0 px-4 pb-4 sm:pb-6 pt-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {/* Google Play */}
            <Link
              href="https://play.google.com/store/apps/details?id=ai.voicica.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/80 border border-gray-700 rounded-lg hover:bg-black transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/>
                <path fill="#FBBC04" d="M17.556 8.237L14.63 10.3 3.609 1.814l.379-.212a1 1 0 0 1 1.02.02l12.548 6.615z"/>
                <path fill="#4285F4" d="M17.556 15.763l-2.926-2.063 2.926-2.063 3.035 1.6a1 1 0 0 1 0 1.725l-3.035 1.6z"/>
                <path fill="#34A853" d="M3.609 22.186l10.183-10.186 2.926 2.063-12.548 7.91a1 1 0 0 1-1.02.02l-.38-.212a1.003 1.003 0 0 1 .84.405z"/>
              </svg>
              <div className="text-left">
                <div className="text-[7px] sm:text-[8px] text-gray-400 leading-none">GET IT ON</div>
                <div className="text-xs sm:text-sm font-semibold text-white leading-tight">Google Play</div>
              </div>
            </Link>

            {/* App Store */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/80 border border-gray-700 rounded-lg opacity-60 cursor-not-allowed">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[7px] sm:text-[8px] text-gray-400 leading-none">Download on the</div>
                <div className="text-xs sm:text-sm font-semibold text-white leading-tight">App Store</div>
                <div className="text-[7px] sm:text-[8px] text-gray-500 leading-none">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
