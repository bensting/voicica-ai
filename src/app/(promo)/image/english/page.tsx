'use client';

import Image from 'next/image';
import { useCallback } from 'react';

// English AI Image Generator landing page - Mobile-first single page design
// Free AI Image Generator Tool

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app&referrer=utm_source%3Dimage_english%26utm_medium%3Dweb%26utm_campaign%3Dlanding_page';
const WEB_APP_URL = '/studio/ai-image';

export default function EnglishImagePage() {
  // Detect Android device for smart redirect
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
      style={{ backgroundImage: 'url(/images/image-bg.webp)' }}
    >
      {/* Overlay for better text readability */}
      <div className="flex-1 flex flex-col bg-black/20">
        {/* ========== Section 1: Header (Title + Subtitle) ========== */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 pt-6 sm:pt-10 lg:pt-12 text-center">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AI Image Generator
            </span>
          </h1>

          {/* FREE */}
          <div className="text-4xl sm:text-5xl lg:text-6xl font-black mb-2 sm:mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-lime-400">
              FREE
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-gray-200 text-sm sm:text-base">
            Free • No Limits
          </p>
        </div>

        {/* ========== Section 2: Demo Image (Flexible) ========== */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 py-1 min-h-0">
          <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl h-full flex items-center justify-center">
            {/* Demo container */}
            <div className="relative w-full h-full max-h-[65vh] sm:max-h-[60vh] flex items-center justify-center">

              {/* Prompt bubble - left side, overlapping with image */}
              <div className="absolute left-0 top-[12%] z-20 w-[45%] sm:w-[40%]">
                <div
                  className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-purple-400/30"
                  style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)' }}
                >
                  <p className="text-white text-xs sm:text-sm italic leading-relaxed">
                    &quot;A cyberpunk cat, neon city, cinematic lighting&quot;
                  </p>
                </div>
              </div>

              {/* Wave/Arrow effect - connecting prompt to image */}
              <div className="absolute left-[18%] top-[45%] z-10 w-[40%]">
                <svg viewBox="0 0 100 30" className="w-full h-auto">
                  {/* Glow filter */}
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Wave path */}
                  <path
                    d="M 5 15 Q 25 5, 45 15 T 85 15"
                    stroke="url(#waveGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    filter="url(#glow)"
                    strokeLinecap="round"
                  />
                  {/* Arrow head */}
                  <polygon
                    points="85,15 78,10 78,20"
                    fill="#c084fc"
                    filter="url(#glow)"
                  />
                </svg>
              </div>

              {/* Generated image - right side */}
              <div
                className="absolute right-0 top-[8%] w-[72%] sm:w-[68%] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-purple-400/50 z-10"
                style={{ boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)' }}
              >
                <Image
                  src="/images/image-demo.webp"
                  alt="AI Generated Image - Cyberpunk Cat"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========== Section 3: CTA + Footer ========== */}
        <div className="flex-shrink-0 px-4 pb-4 sm:pb-6 lg:pb-8 flex flex-col items-center">
          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className="relative inline-flex items-center gap-2 px-8 py-3 sm:px-10 sm:py-4 text-white font-bold rounded-full text-lg sm:text-xl transition-all mb-3 sm:mb-4 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 50%, #7c3aed 100%)',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Create Images Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Footer text */}
          <p className="text-gray-300 text-sm sm:text-base">
            Text → Image in Seconds
          </p>
        </div>
      </div>
    </div>
  );
}
