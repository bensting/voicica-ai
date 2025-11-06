'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';

// 动态导入组件，禁用 SSR
const TTSPage = dynamic(
  () => import('@/components/features/studio/tts/components/TTSPage'),
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
 * - Responsive layout (mobile-first)
 */
export default function StudioTTSPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

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

  return (
    <div className="h-full">
      <TTSPage
        text={text}
        selectedVoice={selectedVoice}
        speed={speed}
        isGenerating={isGenerating}
        error={error}
        audioUrl={audioUrl}
        maxCharacters={maxCharacters}
        availableCharacters={availableCharacters}
        canGenerate={canGenerate}
        handleTextChange={handleTextChange}
        handleVoiceSelect={handleVoiceSelect}
        handleSpeedChange={handleSpeedChange}
        handleGenerate={handleGenerate}
      />
    </div>
  );
}