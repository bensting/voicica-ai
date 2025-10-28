'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';
import DesktopTTSPage from '@/components/features/studio/tts/components/desktop/DesktopTTSPage';
import MobileTTSPage from '@/components/features/studio/tts/components/mobile/MobileTTSPage';

/**
 * Studio TTS Page
 *
 * Text-to-Speech generation page with:
 * - Dynamic user credits display
 * - Internationalization support
 * - Upgrade navigation
 * - Complete TTS generation workflow
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

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:block">
        <DesktopTTSPage {...sharedProps} />
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <MobileTTSPage {...sharedProps} />
      </div>
    </>
  );
}