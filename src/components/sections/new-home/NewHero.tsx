'use client';

import Image from 'next/image';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';
import PhoneMockup from './PhoneMockup';
import ArtShowcase from './ArtShowcase';
import AudioShowcase from './AudioShowcase';

const heroTexts = {
  en: {
    titleLine1: 'Turn Your Ideas',
    titleLine2: 'Into Voice & Art',
    subtitle: '3200+ AI Voices. Professional AI Art. 100% Free',
    showcase: 'Preview Showcase',
    cta: '[ Start Creating Now ]',
    trustText: 'Trusted by 1M+ creators',
    tools: [
      { line1: 'Video', line2: 'Downloader' },
      { line1: 'HD', line2: 'Upscaler' },
      { line1: 'BG', line2: 'Remover' },
    ],
  },
  ja: {
    titleLine1: 'あなたのアイデアを',
    titleLine2: '声とアートに',
    subtitle: '3200以上のAI音声。プロのAIアート。完全無料',
    showcase: 'プレビューショーケース',
    cta: '[ 今すぐ作成する ]',
    trustText: '100万人以上のクリエイターが利用',
    tools: [
      { line1: '動画', line2: 'ダウンロード' },
      { line1: 'HD', line2: '高画質化' },
      { line1: '背景', line2: '削除' },
    ],
  },
} as const;

export default function NewHero({ locale = 'en' }: { locale?: 'en' | 'ja' }) {
  const { backgroundImage, avatars, playStoreUrl } =
    HOME_SHOWCASE_CONFIG;
  const t = heroTexts[locale];

  const handleCTAClick = () => {
    // Microsoft UET 事件追踪
    if (typeof window !== 'undefined' && window.uetq) {
      window.uetq.push('event', 'start_creating_click', {
        event_category: 'cta',
        event_label: 'home_hero',
      });
    }

    // 直接检测 Android，避免 state 延迟问题
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = playStoreUrl;
    } else {
      window.location.href = '/native';
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
          <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 h-[580px] w-[580px] sm:h-[720px] sm:w-[720px] lg:h-[960px] lg:w-[960px] overflow-hidden rounded-3xl">
            <Image
              src={backgroundImage}
              alt=""
              fill
              className="object-cover object-top blur-[10px]"
              priority
            />
            {/* Slight dark overlay for depth */}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="relative z-10">
            {/* Phone glow effect - white */}
            <div className="absolute -inset-6 rounded-[4rem] bg-white/40 blur-2xl" />
            <div className="absolute -inset-3 rounded-[3.5rem] bg-white/20 blur-xl" />
          <PhoneMockup>
          {/* Phone Screen Content */}
          <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[740px]">
            {/* Phone Background Image - fills entire screen */}
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
            <div className="relative flex h-full min-h-[580px] sm:min-h-[640px] lg:min-h-[740px] flex-col justify-between px-5 pb-6 pt-10">
              {/* Top Section */}
              <div>
                {/* Header Logo */}
                <div className="mb-6 flex items-center gap-1">
                  <Image
                    src="/logo/logo-transparent-256.webp"
                    alt="VoicicaAI"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <span className="text-xs font-semibold text-white">VoicicaAI</span>
                </div>

                {/* Main Title */}
                <h1 className="mb-2 text-center text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {t.titleLine1}
                  <br />
                  {t.titleLine2}
                </h1>

                {/* Subtitle - single line, centered */}
                <p className="whitespace-nowrap text-center text-xs text-gray-300 sm:text-sm">
                  {t.subtitle}
                </p>
              </div>

              {/* Bottom Section */}
              <div>
                {/* Preview Showcase Section */}
                <div className="mb-4">
                  <h2 className="mb-3 text-sm font-semibold text-white">
                    {t.showcase}
                  </h2>

                  <div className="flex gap-3">
                    {/* Left: AI Art avatars */}
                    <div className="flex-shrink-0">
                      <ArtShowcase />
                    </div>

                    {/* Right: Audio cards + Free Tools */}
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <AudioShowcase />

                      {/* Free Tools Banner */}
                      <div className="flex flex-1 items-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm px-2 lg:px-3 lg:rounded-2xl">
                        <div className="flex w-full justify-around">
                          <div className="flex flex-col items-center gap-1 lg:flex-row lg:gap-2">
                            <div className="flex h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-600/90">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
                              </svg>
                            </div>
                            <span className="text-[7px] lg:text-[11px] leading-tight text-center lg:text-left text-white/80">{t.tools[0].line1}<br/>{t.tools[0].line2}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 lg:flex-row lg:gap-2">
                            <div className="flex h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-600/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                            <span className="text-[7px] lg:text-[11px] leading-tight text-center lg:text-left text-white/80">{t.tools[1].line1}<br/>{t.tools[1].line2}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 lg:flex-row lg:gap-2">
                            <div className="flex h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0 items-center justify-center rounded-lg bg-pink-600/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                              </svg>
                            </div>
                            <span className="text-[7px] lg:text-[11px] leading-tight text-center lg:text-left text-white/80">{t.tools[2].line1}<br/>{t.tools[2].line2}</span>
                          </div>
                        </div>
                      </div>
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
                      {t.cta}
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
                  <p className="text-xs text-gray-400">{t.trustText}</p>
                </div>
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
