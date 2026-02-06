'use client';

import Image from 'next/image';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';
import PhoneMockup from './PhoneMockup';
import ArtShowcase from './ArtShowcase';
import AudioShowcase from './AudioShowcase';

export default function NewHero() {
  const { isAndroid } = useDeviceDetect();
  const { backgroundImage, avatars, playStoreUrl, trustText } =
    HOME_SHOWCASE_CONFIG;

  const handleCTAClick = () => {
    if (isAndroid) {
      window.open(playStoreUrl, '_blank');
    } else {
      window.location.href = '/studio/tts';
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Outer Background - Dark base */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black" />

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        {/* Background container - square, slightly larger than phone */}
        <div className="relative">
          {/* Square background image behind phone - 1:1 ratio, slightly larger */}
          <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 h-[580px] w-[580px] sm:h-[720px] sm:w-[720px] lg:h-[820px] lg:w-[820px] overflow-hidden rounded-3xl">
            <Image
              src={backgroundImage}
              alt=""
              fill
              className="object-cover object-top blur-[6px]"
              priority
            />
            {/* Slight dark overlay for depth */}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="relative z-10">
          <PhoneMockup>
          {/* Phone Screen Content */}
          <div className="relative flex h-full flex-col">
            {/* Phone Background Image */}
            <div className="absolute inset-0">
              <Image
                src={backgroundImage}
                alt="Background"
                fill
                className="object-cover"
                priority
              />
              {/* Gradient overlays for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>

            {/* Phone Content */}
            <div className="relative flex flex-col px-5 pb-8 pt-10">
              {/* Header Logo */}
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">VoicicaAI</span>
              </div>

              {/* Main Title */}
              <h1 className="mb-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Turn Your Ideas
                <br />
                Into Voice & Art
              </h1>

              {/* Subtitle */}
              <p className="mb-6 text-xs text-gray-300 sm:text-sm">
                3200+ AI Voices. Professional AI Art. 100% Free
              </p>

              {/* Preview Showcase Section */}
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-semibold text-white">
                  Preview Showcase
                </h2>

                <div className="flex gap-3">
                  {/* Left: AI Art avatars */}
                  <div className="flex-shrink-0">
                    <ArtShowcase />
                  </div>

                  {/* Right: Audio cards */}
                  <div className="min-w-0 flex-1">
                    <AudioShowcase />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleCTAClick}
                className="group relative mb-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 p-[2px]"
              >
                <div className="relative flex items-center justify-center rounded-full bg-gray-900/80 px-6 py-3 backdrop-blur-sm transition-colors group-hover:bg-gray-900/60">
                  <span className="text-sm font-semibold text-white">
                    [ Start Creating Now ]
                  </span>
                </div>
              </button>

              {/* Trust Indicator */}
              <div className="flex items-center justify-center gap-2">
                {/* Avatar stack */}
                <div className="flex -space-x-1.5">
                  {avatars.map((avatar, index) => (
                    <div
                      key={index}
                      className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-gray-900"
                    >
                      <Image
                        src={avatar}
                        alt={`User ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">{trustText}</p>
              </div>
            </div>
          </div>
        </PhoneMockup>
          </div>
        </div>
      </div>
    </section>
  );
}
