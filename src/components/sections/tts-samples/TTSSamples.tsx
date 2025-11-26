'use client';

import { useTTSDemo } from './hooks';
import { TTSProductInfo, TTSDemoPanel } from './components';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * TTS Samples Section - Voicica AI Style
 *
 * 展示 TTS 功能，采用深色主题设计：
 * - 左侧：产品介绍、功能列表、CTA 按钮
 * - 右侧：交互式 TTS 演示面板
 *
 * 架构优化：
 * - 使用 useTTSDemo hook 管理状态和业务逻辑
 * - 拆分为 TTSProductInfo 和 TTSDemoPanel 子组件
 * - 主组件只负责布局和数据传递
 */
export default function TTSSamples() {
  const { t } = useLanguage();
  const {
    // 配置状态
    availableLocales,
    maxTextLength,
    isLoadingConfig,

    // TTS 状态
    selectedVoice,
    selectedLocale,
    textInput,
    isPlaying,

    // 语音列表
    availableVoices,
    isLoadingVoices,

    // UI 状态
    isLanguageDropdownOpen,
    isVoiceDropdownOpen,

    // Actions
    handleTextChange,
    handleVoiceSelect,
    handleLocaleSelect,
    toggleLanguageDropdown,
    toggleVoiceDropdown,
  } = useTTSDemo();

  return (
    <section className="py-20 px-3 sm:px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl md:text-5xl font-bold text-white mb-4">
            {t('ttsSamples.sectionTitle.prefix')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {t('ttsSamples.sectionTitle.highlight')}
            </span>{' '}
            {t('ttsSamples.sectionTitle.suffix')}
          </h2>
        </div>

        {/* Main Content Card - 增强发光效果，移动端减小padding */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-4 sm:p-6 md:p-12 border border-gray-700 shadow-2xl shadow-purple-500/10 backdrop-blur-sm">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white text-lg">{t('ttsSamples.demoPanel.loadingConfig')}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
              {/* Left Side: Product Info - 占 2/5 宽度 */}
              <div className="lg:col-span-2">
                <TTSProductInfo />
              </div>

              {/* Right Side: Interactive Demo - 占 3/5 宽度 */}
              <div className="lg:col-span-3">
                <TTSDemoPanel
                  // 语音相关
                  selectedVoice={selectedVoice}
                  availableVoices={availableVoices}
                  isLoadingVoices={isLoadingVoices}
                  isVoiceDropdownOpen={isVoiceDropdownOpen}
                  onVoiceSelect={handleVoiceSelect}
                  onToggleVoiceDropdown={toggleVoiceDropdown}
                  // 语言相关
                  selectedLocale={selectedLocale}
                  availableLocales={availableLocales}
                  isLanguageDropdownOpen={isLanguageDropdownOpen}
                  onLocaleSelect={handleLocaleSelect}
                  onToggleLanguageDropdown={toggleLanguageDropdown}
                  // 文本和播放
                  textInput={textInput}
                  maxTextLength={maxTextLength}
                  isPlaying={isPlaying}
                  onTextChange={handleTextChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}