'use client';

import { Sparkles } from 'lucide-react';

interface CreatePreviewProps {
  // 配置信息
  theme: { icon: string; label: string } | undefined;
  mood: { icon: string; label: string } | undefined;
  vocal: { icon: string; label: string } | undefined;
  duration: string;
  lyrics: string;

  // 时长选择
  onDurationChange: (duration: string) => void;

  // 生成状态
  isGenerating: boolean;
  generatedAudioUrl: string | null;

  // 操作回调
  onGenerate: () => void;
  onRegenerate: () => void;
  onContinueToMV: () => void;
}

/**
 * Create Preview Component
 *
 * 创作预览组件 - 显示配置、时长选择、歌词预览和生成按钮
 */
export default function CreatePreview({
  theme,
  mood,
  vocal,
  duration,
  lyrics,
  onDurationChange,
  isGenerating,
  generatedAudioUrl,
  onGenerate,
  onRegenerate,
  onContinueToMV,
}: CreatePreviewProps) {
  // 生成中
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
          <p className="text-gray-600">正在创作中...</p>
        </div>
      </div>
    );
  }

  // 生成完成
  if (generatedAudioUrl) {
    return (
      <div className="space-y-4">
        {/* 音频播放器占位 */}
        <div className="w-full bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-xl p-8 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-gray-600">音频播放器（待实现）</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          className="w-full py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors font-medium"
        >
          🔄 重新生成歌曲
        </button>

        <button
          type="button"
          onClick={onContinueToMV}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-semibold text-lg"
        >
          🎬 继续制作 MV
        </button>
      </div>
    );
  }

  // 准备生成
  return (
    <div className="space-y-6">
      {/* 配置预览 */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">你的创作配置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Theme */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">主题：</span>
            <span className="font-medium text-gray-900">
              {theme?.icon} {theme?.label}
            </span>
          </div>

          {/* Mood */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">情绪：</span>
            <span className="font-medium text-gray-900">
              {mood?.icon} {mood?.label}
            </span>
          </div>

          {/* Vocal */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">声线：</span>
            <span className="font-medium text-gray-900">
              {vocal?.icon} {vocal?.label}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">时长：</span>
            <span className="font-medium text-gray-900">
              {duration === '1min' && '⏱️ 1 分钟'}
              {duration === '2min' && '⏱️ 2 分钟'}
              {duration === '3min' && '⏱️ 3 分钟'}
            </span>
          </div>
        </div>
      </div>

      {/* 歌词预览 */}
      <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">歌词预览</h3>
          <span className="text-xs text-gray-500">{lyrics.length} 字符</span>
        </div>

        <div className="bg-white rounded-lg p-4 max-h-48 overflow-y-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {lyrics || '暂无歌词'}
          </pre>
        </div>
      </div>

      {/* 时长选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">歌曲时长</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: '1min', label: '1 分钟', icon: '⏱️' },
            { id: '2min', label: '2 分钟', icon: '⏱️' },
            { id: '3min', label: '3 分钟', icon: '⏱️' },
          ].map((durationOption) => (
            <button
              key={durationOption.id}
              type="button"
              onClick={() => onDurationChange(durationOption.id)}
              className={`
                p-3 rounded-xl border-2 transition-all text-center
                ${
                  duration === durationOption.id
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                }
              `}
            >
              <div className="text-xl mb-1">{durationOption.icon}</div>
              <div className="text-sm font-medium">{durationOption.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        type="button"
        onClick={onGenerate}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-semibold text-lg flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        开始生成歌曲
      </button>
    </div>
  );
}