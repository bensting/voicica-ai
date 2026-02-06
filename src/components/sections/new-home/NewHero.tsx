'use client';

import Image from 'next/image';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';
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
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950" />
        {/* Decorative gradient orbs */}
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-cyan-600/20 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Header Logo */}
          <div className="mb-12 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
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
            <span className="text-2xl font-bold text-white">VoicicaAI</span>
          </div>

          {/* Main Title */}
          <h1 className="mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Turn Your Ideas Into
            <br />
            Voice & Art
          </h1>

          {/* Subtitle */}
          <p className="mb-12 max-w-2xl text-lg text-gray-400 sm:text-xl">
            3200+ AI Voices. Professional AI Art. 100% Free
          </p>

          {/* Preview Showcase */}
          <div className="mb-12 w-full max-w-2xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Left: AI Art */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-sm">
                <ArtShowcase />
              </div>

              {/* Right: AI Voice + Music */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-sm">
                <AudioShowcase />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className="group relative mb-8 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Creating Now
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Trust Indicator */}
          <div className="flex items-center gap-3">
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {avatars.map((avatar, index) => (
                <div
                  key={index}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-gray-950"
                >
                  <Image
                    src={avatar}
                    alt={`User ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">{trustText}</p>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
    </section>
  );
}
