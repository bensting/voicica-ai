import { ChevronDown } from 'lucide-react';
import { LocaleOption } from '@/types/config';
import type { Voice } from '@/types/voice';
import { GradientButton } from '@/components/ui';
import LanguageSelector from './LanguageSelector';
import VoiceSelector from './VoiceSelector';

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
  enhanceVoice: boolean;
  isPlaying: boolean;
  onTextChange: (text: string) => void;
  onToggleEnhance: () => void;
  onPlay: () => void;
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
  enhanceVoice,
  isPlaying,
  onTextChange,
  onToggleEnhance,
  onPlay,
}: TTSDemoPanelProps) {
  return (
    <div className="bg-gradient-to-br from-gray-950 to-black rounded-2xl p-6 border border-gray-800">
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
      <div className="relative mb-4">
        <textarea
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={maxTextLength}
          className="w-full h-48 px-4 py-3 bg-gray-900/90 border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-500"
          placeholder="Enter text to convert to speech..."
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
          {textInput.length}/{maxTextLength}
        </div>
      </div>

      {/* Enhance Voice Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Enhance Voice</span>
          <button
            onClick={onToggleEnhance}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enhanceVoice ? 'bg-purple-500' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                enhanceVoice ? 'translate-x-6' : ''
              }`}
            />
          </button>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Listen Button */}
      <GradientButton onClick={onPlay} disabled={isPlaying || !textInput.trim()} fullWidth size="lg">
        {isPlaying ? 'Playing...' : 'Listen'}
      </GradientButton>
    </div>
  );
}