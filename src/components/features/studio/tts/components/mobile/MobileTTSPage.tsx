'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { voiceAPI } from '@/lib/api';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import MobileTextInput from './MobileTextInput';
import ExampleButtons from './ExampleButtons';
import MobileVoiceSelector from './MobileVoiceSelector';
import MobileActionButtons from './MobileActionButtons';

interface MobileTTSPageProps {
  text: string;
  selectedVoice: VoiceModel | null;
  speed: number;
  isGenerating: boolean;
  error: string | null;
  audioUrl: string | null;
  maxCharacters: number;
  availableCharacters: number;
  canGenerate: boolean;
  handleTextChange: (value: string) => void;
  handleVoiceSelect: (voice: VoiceModel) => void;
  handleSpeedChange: (speed: number) => void;
  handleGenerate: () => void;
}

/**
 * Mobile TTS Page Component
 *
 * Simplified mobile-optimized layout for TTS generation
 * Based on TopMediAi mobile design
 */
export default function MobileTTSPage({
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
}: MobileTTSPageProps) {
  const router = useRouter();
  const { locale } = useLanguage();

  // Initialize default voice based on current locale
  useEffect(() => {
    const fetchDefaultVoice = async () => {
      // Only fetch if no voice is selected
      if (!selectedVoice) {
        try {
          // Get first voice matching current locale
          const voices = await voiceAPI.getVoices({
            locale,
            is_active: true,
            limit: 1,
          });

          if (voices && voices.length > 0) {
            handleVoiceSelect(voices[0]);
            console.log('✅ 已加载默认语音:', voices[0]);
          }
        } catch (err) {
          console.error('❌ 获取默认语音失败:', err);
        }
      }
    };

    void fetchDefaultVoice();
  }, [locale, selectedVoice, handleVoiceSelect]);

  const handleSelectExample = (exampleText: string) => {
    handleTextChange(exampleText);
  };

  const handleOpenVoiceModal = () => {
    // TODO: Open voice selection modal
    router.push('/studio/voices');
  };

  const handleOpenSettings = () => {
    // TODO: Open settings modal
    console.log('Open settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="px-4 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-600 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Text Input */}
        <MobileTextInput
          value={text}
          onChange={handleTextChange}
          maxCharacters={maxCharacters}
          availableCharacters={availableCharacters}
          disabled={isGenerating}
        />

        {/* Example Buttons */}
        <ExampleButtons
          onSelectExample={handleSelectExample}
          disabled={isGenerating}
        />

        {/* Voice Selector */}
        <MobileVoiceSelector
          selectedVoice={selectedVoice}
          onOpenVoiceModal={handleOpenVoiceModal}
          disabled={isGenerating}
        />

        {/* Action Buttons */}
        <MobileActionButtons
          onGenerate={handleGenerate}
          onOpenSettings={handleOpenSettings}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
        />

        {/* Audio Player (only shown after generation) */}
        {audioUrl && (
          <div className="p-4 bg-white border-2 border-purple-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Generated Audio
              </h3>
              <a
                href={audioUrl}
                download="ai-voice-output.mp3"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Download
              </a>
            </div>
            <audio
              controls
              src={audioUrl}
              className="w-full"
              style={{
                filter: 'sepia(20%) saturate(70%) hue-rotate(220deg)',
              }}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}