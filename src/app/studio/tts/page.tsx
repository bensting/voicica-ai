'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';
import TextInput from '@/components/features/studio/tts/TextInput';
import VoiceSelector from '@/components/features/studio/tts/VoiceSelector';
import GenerateButton from '@/components/features/studio/tts/GenerateButton';

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
  const router = useRouter();
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

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="bg-gradient-to-b from-white to-purple-50">
      {/* TTS Generator Section */}
      <section className="pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Voice Selector */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg mb-6">
            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelect={handleVoiceSelect}
              disabled={isGenerating}
            />
          </div>

          {/* Text Input & Generation */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg">
            {/* Text Input */}
            <div className="mb-8">
              <TextInput
                value={text}
                onChange={handleTextChange}
                maxCharacters={maxCharacters}
                availableCharacters={availableCharacters}
                disabled={isGenerating}
                selectedVoice={selectedVoice}
                speed={speed}
                onSpeedChange={handleSpeedChange}
              />
            </div>

            {/* Generate Button & Results */}
            <div className="space-y-6">
              <GenerateButton
                onClick={handleGenerate}
                disabled={!canGenerate}
                isGenerating={isGenerating}
              />

              {/* Audio Player */}
              {audioUrl && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Audio
                  </h3>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
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

                    {/* Download Button */}
                    <a
                      href={audioUrl}
                      download="ai-voice-output.mp3"
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Audio
                    </a>
                  </div>
                </div>
              )}

              {/* Upgrade Pro CTA */}
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-yellow-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Upgrade to Pro
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Get unlimited characters, premium voices, and faster
                      generation!
                    </p>
                    <button
                      onClick={handleUpgradeClick}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}