'use client';

import Image from 'next/image';
import { useCallback } from 'react';

// Thai language TTS landing page - Mobile-first single page design
// เครื่องมือแปลงข้อความเป็นเสียง AI ฟรี ภาษาไทย

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app&referrer=utm_source%3Dtts_thai%26utm_medium%3Dweb%26utm_campaign%3Dlanding_page';
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
      className="h-[100dvh] bg-cover bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: 'url(/images/tts-bg.webp)' }}
    >
      {/* Overlay for better text readability */}
      <div className="flex-1 flex flex-col bg-black/30">
        {/* ========== Section 1: Header (Badge + Title + CTA) ========== */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 pt-6 sm:pt-10 lg:pt-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3 sm:mb-4">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs sm:text-sm">ฟรี 100% • ไม่ต้องสมัคร</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
            <span className="text-white">AI </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              แปลงข้อความเป็นเสียง
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-lime-400">ฟรี</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-200 text-sm sm:text-base mb-4 sm:mb-5">
            เสียงสมจริง • ใช้งานได้ทันที • ไม่จำกัด
          </p>

          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className="relative inline-flex items-center gap-2 px-8 py-3 sm:px-10 sm:py-4 text-white font-bold rounded-full text-lg sm:text-xl transition-all mb-2 sm:mb-3 cursor-pointer"
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
          <p className="text-gray-400 text-xs sm:text-sm">
            ผู้ใช้กว่า 10,000+ คน ทั่วโลกใช้แล้ว
          </p>
        </div>

        {/* ========== Section 2: Phone Mockup (Flexible) ========== */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 min-h-0">
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md h-full flex items-center justify-center">
            {/* Left decoration */}
            <div className="absolute left-0 top-1/4 -translate-x-2 sm:-translate-x-12 lg:-translate-x-16">
              <span className="text-yellow-400 text-2xl sm:text-4xl lg:text-5xl font-bold" style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}>
                ฟรี
              </span>
            </div>

            {/* Right decoration */}
            <div className="absolute right-0 top-1/3 translate-x-2 sm:translate-x-12 lg:translate-x-16">
              <span className="text-purple-400 text-base sm:text-2xl lg:text-3xl font-semibold italic" style={{ textShadow: '0 0 20px rgba(192, 132, 252, 0.5)' }}>
                No Limits!
              </span>
            </div>

            {/* Phone Image - scales with container */}
            <div className="relative h-full max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] aspect-[1/2]">
              <Image
                src="/images/tts-app-mockup.png"
                alt="Voicica App - Voice Selection"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* ========== Section 3: Stats + Features (Footer) ========== */}
        <div className="flex-shrink-0 px-4 pb-6 sm:pb-8 lg:pb-10">
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-12 mb-3 sm:mb-4">
            <div className="text-center">
              <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">3,200+</div>
              <div className="text-xs sm:text-sm text-gray-400">เสียง</div>
            </div>
            <div className="w-px h-8 sm:h-12 bg-gray-600" />
            <div className="text-center">
              <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">192+</div>
              <div className="text-xs sm:text-sm text-gray-400">ภาษา</div>
            </div>
            <div className="w-px h-8 sm:h-12 bg-gray-600" />
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-400">
                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-lg sm:text-2xl lg:text-3xl font-bold">ฟรี</span>
                <span className="text-sm sm:text-lg font-medium">ไม่จำกัด</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-400">ราคาคนแทนต์</div>
            </div>
          </div>

          {/* Feature links */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-gray-400 text-xs sm:text-sm">
            <span>ทำวิดีโอ</span>
            <span className="text-gray-600">|</span>
            <span>พากย์เสียง</span>
            <span className="text-gray-600">|</span>
            <span>ทำคอนเทนต์</span>
          </div>
        </div>
      </div>
    </div>
  );
}
