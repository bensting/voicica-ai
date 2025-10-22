'use client';

import { useTTSGenerator } from '@/hooks/useTTSGenerator';
import TextInput from './TextInput';
import VoiceSelector from './VoiceSelector';
import GenerateButton from './GenerateButton';

interface TTSGeneratorProps {
  maxCharacters?: number;
}

/**
 * TTS 生成器主组件
 *
 * 组合所有子组件，提供完整的 TTS 生成功能
 * 响应式布局：
 * - 移动端：垂直堆叠（文本输入 -> 语音选择 -> 生成按钮）
 * - 桌面端：左右布局 + 底部生成按钮（左侧文本输入2/3，右侧语音选择1/3，底部生成按钮全宽）
 */
export default function TTSGenerator({
  maxCharacters = 120,
}: TTSGeneratorProps) {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* 语音选择区域 - 独立背景容器 */}
      <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg mb-6">
        <VoiceSelector
          selectedVoice={selectedVoice}
          onSelect={handleVoiceSelect}
          disabled={isGenerating}
        />
      </div>

      {/* 主背景容器 */}
      <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg">
        {/* 文本输入区域 */}
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

        {/* 下部：生成按钮（全宽） */}
        <div className="space-y-6">
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            isGenerating={isGenerating}
          />

          {/* 音频播放器 */}
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

                {/* 下载按钮 */}
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

          {/* Upgrade Pro 提示 */}
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
                <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}