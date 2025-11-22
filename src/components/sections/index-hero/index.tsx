'use client';

import { useState, useRef } from 'react';
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
  highlight: string;
  description: string;
  actionButtons: ActionButton[];
  backgroundVideo?: string;
  backgroundImage?: string;
}

/**
 * Hero 主视觉区组件
 *
 * 带视频/图片背景的大型 Hero 区域，支持多个 CTA 按钮
 */
export default function Hero({
  brandName = 'AI Voice Labs',
  title,
  highlight,
  description,
  actionButtons,
  backgroundVideo,
  backgroundImage,
}: HeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { locale } = useLanguage();

  // 泰语需要较小的字体
  const isThaiLang = locale === 'th-TH';

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video or Image */}
      {backgroundVideo ? (
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

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* Brand Name */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {brandName}{''}
            <span className="inline-flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                .com
              </span>
              <sup className="text-xs text-white/70 ml-1">®</sup>
            </span>
          </h2>
        </div>

        {/* Main Title */}
        <h1 className={`font-bold text-white mb-4 ${
          isThaiLang
            ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-snug'
            : 'text-3xl md:text-4xl lg:text-5xl leading-tight'
        }`}>
          <span className="block">{title}</span>
          <span className={`block relative ${isThaiLang ? 'break-all px-2' : 'overflow-hidden'}`}>
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 ${
              isThaiLang
                ? ''
                : 'animate-text-reveal text-2xl md:text-3xl lg:text-4xl'
            }`}>
              {highlight}
            </span>
          </span>
        </h1>

        {/* Description */}
        <p className={`text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed ${
          isThaiLang
            ? 'text-sm sm:text-base md:text-lg'
            : 'text-base md:text-lg lg:text-xl'
        }`}>
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {actionButtons.map((button, index) => (
            <GradientButton
              key={index}
              onClick={button.onClick}
              size="md"
              className="w-full sm:w-auto min-w-[240px] py-4 rounded-xl"
            >
              <span>{button.text}</span>
              {button.icon}
            </GradientButton>
          ))}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}