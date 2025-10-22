import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoices } from './hooks/useVoices';
import { useVoiceFilters } from './hooks/useVoiceFilters';
import { useVoiceOptions } from './hooks/useVoiceOptions';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import VoiceFilters from './VoiceFilters';
import VoiceCard from './VoiceCard';

interface VoiceSelectorProps {
  selectedVoice: VoiceModel | null;
  onSelect: (voice: VoiceModel) => void;
  disabled?: boolean;
}

/**
 * 语音选择器组件
 *
 * 显示可用的语音模型列表，从后端 API 获取数据
 */
export default function VoiceSelector({
  selectedVoice,
  onSelect,
  disabled = false,
}: VoiceSelectorProps) {
  const { t, locale } = useLanguage();

  // 获取语音数据
  const { voices, loading, error } = useVoices();

  // 音频播放控制
  const { playingVoiceId, handlePlayPause } = useAudioPlayer();

  // 生成选项
  const { languages, countryOptions, languageOptions, genderOptions } = useVoiceOptions({
    voices,
    availableLanguages: [],
    locale,
    t,
  });

  // 筛选逻辑
  const {
    searchQuery,
    setSearchQuery,
    selectedCountry,
    setSelectedCountry,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    availableLanguages,
    filteredVoices,
  } = useVoiceFilters({ voices, languages });

  // 更新选项（使用实际的 availableLanguages）
  const updatedOptions = useVoiceOptions({
    voices,
    availableLanguages,
    locale,
    t,
  });

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Select a voice
        </h2>
      </div>

      {/* 筛选器 */}
      <VoiceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        countryOptions={updatedOptions.countryOptions}
        languageOptions={updatedOptions.languageOptions}
        genderOptions={updatedOptions.genderOptions}
        disabled={disabled || loading}
        t={t}
      />

      {/* 语音列表 */}
      <div className="max-h-96 overflow-y-auto pr-2">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading voices...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-purple-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredVoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No voices found matching your criteria
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {!loading && !error && filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={selectedVoice?.id === voice.id}
              isPlaying={playingVoiceId === voice.id}
              disabled={disabled}
              onSelect={onSelect}
              onPlayPause={handlePlayPause}
            />
          ))}
        </div>
      </div>
    </div>
  );
}