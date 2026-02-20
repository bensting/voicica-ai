'use client';

import { useRef, useState } from 'react';
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
  'zh-Hant': {
    titleLine1: '將你的創意',
    titleLine2: '化為聲音與藝術',
    subtitle: '3200+ AI語音。專業AI藝術。100%免費',
    showcase: '預覽展示',
    cta: '[ 立即開始創作 ]',
    trustText: '超過100萬創作者的信賴之選',
    tools: [
      { line1: '影片', line2: '下載' },
      { line1: 'HD', line2: '高畫質化' },
      { line1: '背景', line2: '移除' },
    ],
  },
  ko: {
    titleLine1: '아이디어를',
    titleLine2: '음성과 아트로',
    subtitle: '3200+ AI 음성. 전문 AI 아트. 100% 무료',
    showcase: '미리보기 쇼케이스',
    cta: '[ 지금 만들기 시작 ]',
    trustText: '100만+ 크리에이터가 신뢰',
    tools: [
      { line1: '동영상', line2: '다운로드' },
      { line1: 'HD', line2: '업스케일' },
      { line1: '배경', line2: '제거' },
    ],
  },
  th: {
    titleLine1: 'เปลี่ยนไอเดีย',
    titleLine2: 'เป็นเสียงและศิลปะ',
    subtitle: '3200+ เสียง AI. ศิลปะ AI ระดับมือ. ฟรี 100%',
    showcase: 'ตัวอย่างผลงาน',
    cta: '[ เริ่มสร้างเลย ]',
    trustText: 'ครีเอเตอร์กว่า 1 ล้านคนไว้วางใจ',
    tools: [
      { line1: 'ดาวน์โหลด', line2: 'วิดีโอ' },
      { line1: 'HD', line2: 'อัปสเกล' },
      { line1: 'ลบ', line2: 'พื้นหลัง' },
    ],
  },
  es: {
    titleLine1: 'Convierte Tus Ideas',
    titleLine2: 'En Voz y Arte',
    subtitle: '3200+ Voces IA. Arte IA Profesional. 100% Gratis',
    showcase: 'Vista Previa',
    cta: '[ Empieza a Crear Ahora ]',
    trustText: 'Más de 1M de creadores confían en nosotros',
    tools: [
      { line1: 'Descargar', line2: 'Video' },
      { line1: 'HD', line2: 'Escalador' },
      { line1: 'Eliminar', line2: 'Fondo' },
    ],
  },
} as const;

export default function NewHero({ locale = 'en' }: { locale?: string }) {
  const { backgroundImage, avatars, playStoreUrl } =
    HOME_SHOWCASE_CONFIG;
  const t = heroTexts[locale as keyof typeof heroTexts] || heroTexts.en;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

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
      {/* Background - static image on mobile, video on desktop */}
      <div className="absolute inset-0">
        {/* Mobile: static image */}
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover lg:hidden"
          priority
        />
        {/* Desktop: video background */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={backgroundImage}
          className="pointer-events-none hidden h-full w-full object-cover lg:block"
        >
          <source src="https://cdn.voicica.ai/videos/vtEyZ69jh3YfkGlyweAnJR6fhR13/video_9fcba2fc-7d17-41c7-b787-dc68d82bc95d.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Mute/Unmute toggle - desktop only */}
        <button
          onClick={toggleMute}
          className="absolute bottom-6 right-6 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 lg:flex"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative">

          <div className="relative z-10">
            {/* Phone glow effect - white */}
            <div className="absolute -inset-6 rounded-[4rem] bg-white/40 blur-2xl" />
            <div className="absolute -inset-3 rounded-[3.5rem] bg-white/20 blur-xl" />
          <PhoneMockup>
          {/* Phone Screen Content */}
          <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[740px]">
            {/* Phone Background - mobile: 9:16 video, desktop: static image */}
            <div className="absolute inset-0">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={backgroundImage}
                className="pointer-events-none h-full w-full object-cover lg:hidden"
              >
                <source src="https://cdn.voicica.ai/videos/vtEyZ69jh3YfkGlyweAnJR6fhR13/video_2973c444-efec-4c87-a736-720ccce75a9d.mp4" type="video/mp4" />
              </video>
              <Image
                src={backgroundImage}
                alt="Background"
                fill
                className="hidden object-cover lg:block"
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
