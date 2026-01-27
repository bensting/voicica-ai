import { useRouter } from 'next/navigation';
import { LocaleOption } from '@/types/config';
import type { Voice } from '@/types/voice';
import { GradientButton } from '@/components/ui';
import LanguageSelector from './LanguageSelector';
import VoiceSelector from './VoiceSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopunder } from '@/hooks/usePopunder';

interface TTSDemoPanelProps {
  // 语音相关
  selectedVoice: Voice | null;
  availableVoices: Voice[];
  isLoadingVoices: boolean;
  isVoiceDropdownOpen: boolean;
  onVoiceSelect: (voice: Voice) => void;
  onToggleVoiceDropdown: () => void;

  // 语言相关
  selectedLocale: LocaleOption | null;
  availableLocales: LocaleOption[];
  isLanguageDropdownOpen: boolean;
  onLocaleSelect: (locale: LocaleOption) => void;
  onToggleLanguageDropdown: () => void;

  // 文本和播放
  textInput: string;
  maxTextLength: number;
  isPlaying: boolean;
  onTextChange: (text: string) => void;
}

/**
 * TTS Demo Panel Component
 * 交互式 TTS 演示面板
 *
 * 集成功能：
 * - 使用 LanguageSelector 组件选择语言
 * - 从后端配置动态获取可用语言
 * - 根据配置限制文本长度
 */
export default function TTSDemoPanel({
  // 语音相关
  selectedVoice,
  availableVoices,
  isLoadingVoices,
  isVoiceDropdownOpen,
  onVoiceSelect,
  onToggleVoiceDropdown,

  // 语言相关
  selectedLocale,
  availableLocales,
  isLanguageDropdownOpen,
  onLocaleSelect,
  onToggleLanguageDropdown,

  // 文本和播放
  textInput,
  maxTextLength,
  isPlaying,
  onTextChange,
}: TTSDemoPanelProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { triggerPopunder } = usePopunder();

  // Navigate to TTS page with pre-filled text and voice
  const handleListenClick = () => {
    if (!textInput.trim() || !selectedVoice) return;

    // 触发 Popunder 广告（24小时内只触发一次）
    triggerPopunder();

    // Store the data in localStorage so the TTS page can read it
    localStorage.setItem('tts_prefill_text', textInput);
    localStorage.setItem('tts_prefill_voice', JSON.stringify(selectedVoice));

    // Navigate to TTS page
    router.push('/studio/tts');
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-3 sm:p-4 md:p-6 border border-pink-200">
      {/* Voice & Language Selection */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-4">
        <div className="w-full md:flex-1">
          <VoiceSelector
            selectedVoice={selectedVoice}
            availableVoices={availableVoices}
            isLoading={isLoadingVoices}
            onSelect={onVoiceSelect}
            isOpen={isVoiceDropdownOpen}
            onToggle={onToggleVoiceDropdown}
          />
        </div>
        <div className="w-full md:w-auto md:flex-shrink-0">
          <LanguageSelector
            selectedLocale={selectedLocale}
            availableLocales={availableLocales}
            onSelect={onLocaleSelect}
            isOpen={isLanguageDropdownOpen}
            onToggle={onToggleLanguageDropdown}
          />
        </div>
      </div>

      {/* Text Input - 增加高度和对比度 */}
      <div className="relative mb-6">
        <textarea
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={maxTextLength}
          className="w-full h-48 px-4 py-3 bg-white border border-pink-200 rounded-xl text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder:text-gray-400"
          placeholder={t('ttsSamples.demoPanel.textPlaceholder')}
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
          {textInput.length}/{maxTextLength}
        </div>
      </div>

      {/* Listen Button */}
      <GradientButton onClick={handleListenClick} disabled={isPlaying || !textInput.trim()} fullWidth size="lg" variant="pink-rose">
        {isPlaying ? t('ttsSamples.demoPanel.playingButton') : t('ttsSamples.demoPanel.listenButton')}
      </GradientButton>
    </div>
  );
}