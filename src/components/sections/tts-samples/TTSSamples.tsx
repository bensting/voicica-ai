'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Mic2, Mic } from 'lucide-react';
import { useTTSDemo } from './hooks';
import { TTSProductInfo, TTSDemoPanel } from './components';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientButton } from '@/components/ui';

// 产品标签配置
const PRODUCT_TABS = [
  { id: 'ai-music', label: 'AI Music', icon: Music },
  { id: 'ai-cover', label: 'AI Cover', icon: Mic2 },
  { id: 'text-to-voice', label: 'Text to Voice', icon: Mic },
] as const;

type ProductTab = typeof PRODUCT_TABS[number]['id'];

/**
 * Star Products Section - Voicica AI
 *
 * 展示多个明星产品，通过标签切换：
 * - AI Music: AI 音乐生成
 * - AI Cover: AI 翻唱
 * - Text to Voice: 文字转语音
 */
export default function TTSSamples() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductTab>('text-to-voice');

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

  // 渲染 AI Music 内容
  const renderAIMusicContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* 左侧：产品介绍 */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">AI Music Generator</h3>
        </div>

        <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-5 leading-snug">
          Create{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
            Original Music
          </span>{' '}
          from Your Lyrics
        </h4>

        <ul className="space-y-3 mb-8 text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Transform lyrics into complete songs with AI</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Multiple music styles: Pop, Rock, R&B, Electronic & more</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Professional-quality audio output</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Generate 2 versions to choose from</span>
          </li>
        </ul>

        <GradientButton
          size="lg"
          variant="pink-rose"
          className="w-fit"
          onClick={() => router.push('/studio/ai-song')}
        >
          Create Music Now
        </GradientButton>
      </div>

      {/* 右侧：示意图或演示 */}
      <div
        className="rounded-2xl p-6 border border-pink-200 flex items-center justify-center min-h-[300px] relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/pink_music_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-200">
            <Music className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-800 mb-2 font-medium bg-white/60 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
            Write your lyrics, choose a style
          </p>
          <p className="text-gray-900 font-bold text-lg drop-shadow-sm">
            AI creates your song in minutes
          </p>
        </div>
      </div>
    </div>
  );

  // 渲染 AI Cover 内容
  const renderAICoverContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* 左侧：产品介绍 */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">AI Cover Generator</h3>
        </div>

        <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-5 leading-snug">
          Transform Any Song with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
            AI Voices
          </span>
        </h4>

        <ul className="space-y-3 mb-8 text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Upload any song and change the voice</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>100+ AI voice models to choose from</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Clone your own voice for personalized covers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>High-quality audio preservation</span>
          </li>
        </ul>

        <GradientButton
          size="lg"
          variant="pink-rose"
          className="w-fit"
          onClick={() => router.push('/studio/ai-cover')}
        >
          Create Cover Now
        </GradientButton>
      </div>

      {/* 右侧：示意图或演示 */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
            <Mic2 className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 mb-4">Upload a song, select an AI voice</p>
          <p className="text-gray-900 font-semibold">Get your personalized cover instantly</p>
        </div>
      </div>
    </div>
  );

  // 渲染 Text to Voice 内容
  const renderTTSContent = () => (
    <>
      {isLoadingConfig ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 text-lg">{t('ttsSamples.demoPanel.loadingConfig')}</div>
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
    </>
  );

  return (
    <section className="py-12 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-white via-pink-50/50 to-rose-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
            Voicica AI&apos;s{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              Star Products
            </span>{' '}
            You Can&apos;t Miss
          </h2>

          {/* Product Tabs */}
          <div className="flex justify-center gap-2 sm:gap-4">
            {PRODUCT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200'
                      : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-12 border border-pink-100 shadow-xl shadow-pink-100/50">
          {activeTab === 'ai-music' && renderAIMusicContent()}
          {activeTab === 'ai-cover' && renderAICoverContent()}
          {activeTab === 'text-to-voice' && renderTTSContent()}
        </div>
      </div>
    </section>
  );
}
