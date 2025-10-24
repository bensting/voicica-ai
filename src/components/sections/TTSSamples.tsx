'use client';

import { useMemo } from 'react';
import { Play, Download } from 'lucide-react';

/**
 * TTS Samples Section
 *
 * 展示 TTS 功能示例，包含：
 * - 左侧：文本输入框展示（只读）
 * - 右侧：语音选择器
 * - 底部：播放控制条
 */
export default function TTSSamples() {
  const sampleText = "Transform your text into natural-sounding speech with our advanced AI voice technology. Choose from a wide variety of voices and languages to bring your content to life.";

  // 生成固定的波形数据，避免 hydration mismatch
  // 使用固定的数值数组，确保服务端和客户端完全一致
  const waveformBars = useMemo(() => {
    return [
      { height: 60, opacity: 0.7 },
      { height: 45, opacity: 0.5 },
      { height: 75, opacity: 0.8 },
      { height: 30, opacity: 0.4 },
      { height: 85, opacity: 0.9 },
      { height: 50, opacity: 0.6 },
      { height: 70, opacity: 0.75 },
      { height: 40, opacity: 0.45 },
      { height: 90, opacity: 0.95 },
      { height: 55, opacity: 0.65 },
      { height: 65, opacity: 0.7 },
      { height: 35, opacity: 0.5 },
      { height: 80, opacity: 0.85 },
      { height: 48, opacity: 0.6 },
      { height: 72, opacity: 0.8 },
      { height: 42, opacity: 0.5 },
      { height: 88, opacity: 0.9 },
      { height: 52, opacity: 0.6 },
      { height: 68, opacity: 0.75 },
      { height: 38, opacity: 0.45 },
      { height: 78, opacity: 0.8 },
      { height: 46, opacity: 0.55 },
      { height: 82, opacity: 0.85 },
      { height: 44, opacity: 0.5 },
      { height: 76, opacity: 0.8 },
      { height: 50, opacity: 0.6 },
      { height: 70, opacity: 0.75 },
      { height: 40, opacity: 0.5 },
      { height: 85, opacity: 0.9 },
      { height: 55, opacity: 0.65 },
      { height: 65, opacity: 0.7 },
      { height: 35, opacity: 0.45 },
      { height: 80, opacity: 0.85 },
      { height: 48, opacity: 0.6 },
      { height: 72, opacity: 0.75 },
      { height: 42, opacity: 0.5 },
      { height: 88, opacity: 0.9 },
      { height: 52, opacity: 0.65 },
      { height: 68, opacity: 0.75 },
      { height: 38, opacity: 0.45 },
      { height: 75, opacity: 0.8 },
      { height: 45, opacity: 0.55 },
      { height: 82, opacity: 0.85 },
      { height: 44, opacity: 0.5 },
      { height: 78, opacity: 0.8 },
      { height: 50, opacity: 0.6 },
      { height: 70, opacity: 0.75 },
      { height: 40, opacity: 0.5 },
      { height: 85, opacity: 0.9 },
      { height: 55, opacity: 0.65 }
    ];
  }, []);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Try Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              AI Voice Generator
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the power of natural-sounding AI voices. Listen to our sample and see how easy it is to create professional voiceovers.
          </p>
        </div>

        {/* Main Content: Left (2/3) + Right (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right: Voice Selector (显示在移动端顶部，桌面端右侧) */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a voice</h3>

              {/* Language Selector */}
              <div className="mb-4">
                <button className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">🌐 English</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Search Box */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search voices"
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Voice List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[
                  { name: 'Elon Musk', accent: 'US', description: 'Transform your education...' },
                  { name: 'SpongeBob SquarePants', accent: 'US', description: 'Unleash infectious...' },
                  { name: 'Donald J. Trump', accent: 'US', description: 'Unlock powerful audio...' },
                  { name: 'Trump', accent: 'US', description: 'Unleash powerful audio...' }
                ].map((voice, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-purple-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-white text-xs font-medium text-gray-600 rounded border border-gray-200">
                          {voice.accent}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 truncate">{voice.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{voice.description}</p>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-shadow flex-shrink-0">
                      <Play className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left: Text Input Display (Read-only) + Play Control */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {/* Text Display Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sample Text</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  Preview
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={sampleText}
                  readOnly
                  className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 resize-none focus:outline-none cursor-default"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                  {sampleText.length} characters
                </div>
              </div>
            </div>

            {/* Play Control Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-6">
                {/* Play Button */}
                <button className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </button>

                {/* Waveform / Progress Bar */}
                <div className="flex-1">
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Placeholder for waveform */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-end gap-1 h-8">
                        {waveformBars.map((bar, i) => (
                          <div
                            key={i}
                            className="w-1 bg-purple-400 rounded-full transition-all"
                            style={{
                              height: `${bar.height}%`,
                              opacity: bar.opacity
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Progress overlay */}
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-purple-500/10" />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0:00</span>
                    <span>0:15</span>
                  </div>
                </div>

                {/* Download Button */}
                <button className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-8">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
            Try It Yourself - Start Free
          </button>
        </div>
      </div>
    </section>
  );
}