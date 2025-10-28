'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';

// 动态导入组件，禁用 SSR
const DesktopTTSPage = dynamic(
  () => import('@/components/features/studio/tts/components/desktop/DesktopTTSPage'),
  { ssr: false }
);
const MobileTTSPage = dynamic(
  () => import('@/components/features/studio/tts/components/mobile/MobileTTSPage'),
  { ssr: false }
);

/**
 * Studio TTS Page
 *
 * Text-to-Speech generation page with:
 * - Dynamic user credits display
 * - Internationalization support
 * - Upgrade navigation
 * - Complete TTS generation workflow
 * - 响应式布局：只挂载当前设备需要的组件
 */
export default function StudioTTSPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // 初始检测
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set page title
  useEffect(() => {
    setTitle(t('studio.tts'));
  }, [t, setTitle]);

  // TTS Generator logic
  const maxCharacters = 500;
  const {
    text,
    selectedVoice,
    speed,
    isGenerating,
    error,
    audioUrl,
    availableCharacters,
    canGenerate,
    handleTextChange,
    handleVoiceSelect,
    handleSpeedChange,
    handleGenerate,
  } = useTTSGenerator(maxCharacters);

  // Shared props for both desktop and mobile
  const sharedProps = {
    text,
    selectedVoice,
    speed,
    isGenerating,
    error,
    audioUrl,
    maxCharacters,
    availableCharacters,
    canGenerate,
    handleTextChange,
    handleVoiceSelect,
    handleSpeedChange,
    handleGenerate,
  };

  // 等待设备类型检测完成
  if (isMobile === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // 只渲染需要的组件
  return isMobile ? (
    <div className="h-full">
      <MobileTTSPage {...sharedProps} />
    </div>
  ) : (
    <DesktopTTSPage {...sharedProps} />
  );
}