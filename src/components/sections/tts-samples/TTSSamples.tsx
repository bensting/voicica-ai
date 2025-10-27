'use client';

import { useTTSDemo } from './hooks';
import { TTSProductInfo, TTSDemoPanel } from './components';

/**
 * TTS Samples Section - TopMediai Style
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
  const {
    // 配置状态
    availableLocales,
    maxTextLength,
    isLoadingConfig,

    // TTS 状态
    selectedVoice,
    selectedLocale,
    textInput,
    enhanceVoice,
    isPlaying,

    // 语音列表
    availableVoices,
    isLoadingVoices,

    // UI 状态
    isLanguageDropdownOpen,
    isVoiceDropdownOpen,

    // Actions
    handleTextChange,
    toggleEnhanceVoice,
    handlePlay,
    handleVoiceSelect,
    handleLocaleSelect,
    toggleLanguageDropdown,
    toggleVoiceDropdown,
  } = useTTSDemo();

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            AI Voice Labs's{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Star Product
            </span>{' '}
            You Can't Miss 👍
          </h2>
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl p-8 md:p-12 border border-gray-700/50 backdrop-blur-sm">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white text-lg">Loading configuration...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
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
                  enhanceVoice={enhanceVoice}
                  isPlaying={isPlaying}
                  onTextChange={handleTextChange}
                  onToggleEnhance={toggleEnhanceVoice}
                  onPlay={handlePlay}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}