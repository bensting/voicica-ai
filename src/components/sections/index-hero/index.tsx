'use client';

import { useState, useRef, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';

interface ActionButton {
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface HeroProps {
  brandName?: string;
  title: string;
  subtitle?: string;
  features?: string[];
  description?: string;
  highlight?: string;
  actionButtons: ActionButton[];
  backgroundVideo?: string;
  backgroundImage?: string;
  variant?: 'default' | 'tts';
}

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

/**
 * Hero 主视觉区组件
 *
 * 支持两种模式:
 * - default: 传统的 title + highlight + description
 * - tts: 新版 TTS 聚焦布局 title + subtitle + features
 */
export default function Hero({
  brandName = 'Voicica',
  title,
  subtitle,
  features,
  description,
  highlight,
  actionButtons,
  backgroundVideo,
  backgroundImage,
  variant = 'default',
}: HeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { locale, isReady } = useLanguage();

  // 泰语需要较小的字体
  const isThaiLang = isReady && locale === 'th-TH';

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // TTS 变体：声波渐变背景
  const isTTSVariant = variant === 'tts';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {isTTSVariant ? (
        <>
          {/* TTS 变体：紫色渐变 + 声波动效 */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]" />
          <SoundWaveAnimation />
        </>
      ) : backgroundVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>

          {/* Mute/Unmute Toggle Button */}
          <button
            onClick={toggleMute}
            className="absolute top-24 right-6 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all duration-300 group"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            ) : (
              <Volume2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>
        </>
      ) : backgroundImage ? (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
      )}

      {/* Dark Overlay (不用于 TTS 变体) */}
      {!isTTSVariant && <div className="absolute inset-0 bg-black/50" />}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
        {/* Brand Name */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {brandName}
            <span className="inline-flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                .AI
              </span>
              <sup className="text-xs text-white/70 ml-1">®</sup>
            </span>
          </h2>
        </div>

        {isTTSVariant ? (
          <>
            {/* TTS 变体布局 */}
            {/* Main Title (Slogan) */}
            <h1 className={`font-bold text-white mb-4 ${
              isThaiLang
                ? 'text-2xl sm:text-3xl md:text-4xl leading-snug'
                : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight'
            }`}>
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 font-semibold mb-8">
                {subtitle}
              </p>
            )}

            {/* Features List */}
            {features && features.length > 0 && (
              <div className="space-y-3 mb-10 max-w-2xl mx-auto">
                {features.map((feature, index) => (
                  <p key={index} className="text-white/80 text-base md:text-lg">
                    {feature}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* 默认布局 */}
            {/* Main Title */}
            <h1 className={`font-bold text-white mb-4 ${
              isThaiLang
                ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-snug'
                : 'text-3xl md:text-4xl lg:text-5xl leading-tight'
            }`}>
              <span className="block">{title}</span>
              {highlight && (
                <span className={`block relative ${isThaiLang ? 'break-all px-2' : 'overflow-hidden'}`}>
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 ${
                    isThaiLang ? '' : 'animate-text-reveal text-2xl md:text-3xl lg:text-4xl'
                  }`}>
                    {highlight}
                  </span>
                </span>
              )}
            </h1>

            {/* Description */}
            {description && (
              <p className={`text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed ${
                isThaiLang
                  ? 'text-sm sm:text-base md:text-lg'
                  : 'text-base md:text-lg lg:text-xl'
              }`}>
                {description}
              </p>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {actionButtons.map((button, index) => (
            <GradientButton
              key={index}
              onClick={button.onClick}
              size="md"
              className="w-full sm:w-auto min-w-[280px] py-4 rounded-xl text-lg"
            >
              <span>{button.text}</span>
              {button.icon}
            </GradientButton>
          ))}
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
  );
}