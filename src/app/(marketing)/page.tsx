'use client';

import { useRouter } from 'next/navigation';
import { Music, Mic } from 'lucide-react';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';

// 预生成的声波数据（避免 hydration mismatch）
const SOUND_WAVE_DATA = [
  { height: 65, duration: 0.72 },
  { height: 45, duration: 0.85 },
  { height: 80, duration: 0.58 },
  { height: 35, duration: 0.92 },
  { height: 90, duration: 0.65 },
  { height: 55, duration: 0.78 },
  { height: 70, duration: 0.55 },
  { height: 40, duration: 0.88 },
  { height: 85, duration: 0.62 },
  { height: 50, duration: 0.95 },
  { height: 75, duration: 0.68 },
  { height: 60, duration: 0.82 },
  { height: 95, duration: 0.52 },
  { height: 30, duration: 0.98 },
  { height: 88, duration: 0.58 },
  { height: 42, duration: 0.75 },
  { height: 78, duration: 0.62 },
  { height: 58, duration: 0.88 },
  { height: 92, duration: 0.55 },
  { height: 48, duration: 0.92 },
  { height: 82, duration: 0.65 },
  { height: 38, duration: 0.85 },
  { height: 72, duration: 0.72 },
  { height: 52, duration: 0.78 },
  { height: 98, duration: 0.58 },
  { height: 28, duration: 0.95 },
  { height: 68, duration: 0.68 },
  { height: 46, duration: 0.82 },
  { height: 86, duration: 0.55 },
  { height: 56, duration: 0.92 },
  { height: 76, duration: 0.62 },
  { height: 62, duration: 0.75 },
  { height: 94, duration: 0.58 },
  { height: 34, duration: 0.88 },
  { height: 84, duration: 0.65 },
  { height: 44, duration: 0.82 },
  { height: 74, duration: 0.72 },
  { height: 54, duration: 0.95 },
  { height: 96, duration: 0.55 },
  { height: 36, duration: 0.85 },
];

/**
 * 声波动画组件
 */
function SoundWaveAnimation() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
      <div className="flex items-end gap-1 h-64">
        {SOUND_WAVE_DATA.map((wave, i) => (
          <div
            key={i}
            className="w-1 md:w-1.5 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
            style={{
              height: `${wave.height}%`,
              animation: `soundWave ${wave.duration}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]" />
        <SoundWaveAnimation />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          {/* Brand Name */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Voicica
              <span className="inline-flex items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  .AI
                </span>
                <sup className="text-xs text-white/70 ml-1">®</sup>
              </span>
            </h2>
          </div>

          {/* Main Title */}
          <h1 className="font-bold text-white mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            {t('home.heroTitlePrefix')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              {t('home.heroTitleHighlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-10">
            {t('home.heroDescription')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <GradientButton
              onClick={() => router.push('/studio/ai-song')}
              size="md"
              className="w-full sm:w-auto min-w-[200px] py-4 rounded-xl text-lg"
            >
              <span>{t('home.lyricsToMusic')}</span>
              <Music className="w-5 h-5 ml-2" />
            </GradientButton>
            <GradientButton
              onClick={() => router.push('/studio/tts')}
              size="md"
              className="w-full sm:w-auto min-w-[200px] py-4 rounded-xl text-lg"
            >
              <span>{t('home.textToSpeech')}</span>
              <Mic className="w-5 h-5 ml-2" />
            </GradientButton>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

        {/* 声波动画样式 */}
        <style jsx>{`
          @keyframes soundWave {
            0% {
              transform: scaleY(0.3);
            }
            100% {
              transform: scaleY(1);
            }
          }
        `}</style>
      </section>

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}