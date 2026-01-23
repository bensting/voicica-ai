'use client';

import { useRef, useState } from 'react';
import { Sparkles, Play, Pause, Download, RefreshCw, Wand2 } from 'lucide-react';

interface CreatePreviewProps {
  // 配置信息
  theme: { icon: string; label: string } | undefined;
  mood: { icon: string; label: string } | undefined;
  vocal: { icon: string; label: string } | undefined;
  lyrics: string;

  // 可编辑字段
  style: string;
  title: string;
  vocalGender: '' | 'm' | 'f';
  onStyleChange: (style: string) => void;
  onTitleChange: (title: string) => void;
  onVocalGenderChange: (gender: '' | 'm' | 'f') => void;

  // AI 生成风格
  onGenerateStyle?: () => void;
  isGeneratingStyle?: boolean;

  // 生成状态
  isGenerating: boolean;
  generatedAudioUrl: string | null;
  generatedCoverUrl?: string | null;
  generatedTitle?: string | null;

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
  lyrics,
  style,
  title,
  vocalGender,
  onStyleChange,
  onTitleChange,
  onVocalGenderChange,
  onGenerateStyle,
  isGeneratingStyle,
  isGenerating,
  generatedAudioUrl,
  generatedCoverUrl,
  generatedTitle,
  onGenerate,
  onRegenerate,
  onContinueToMV,
}: CreatePreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (generatedAudioUrl) {
      const link = document.createElement('a');
      link.href = generatedAudioUrl;
      link.download = `${generatedTitle || 'ai-song'}.mp3`;
      link.click();
    }
  };

  // 生成中
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">正在创作中...</p>
          <p className="text-sm text-gray-400">这可能需要 1-3 分钟</p>
        </div>
      </div>
    );
  }

  // 生成完成
  if (generatedAudioUrl) {
    return (
      <div className="space-y-4">
        {/* 音频播放器 */}
        <div className="w-full bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-xl p-6">
          <div className="flex items-center gap-4">
            {/* 封面图 */}
            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-pink-400 to-fuchsia-500">
              {generatedCoverUrl ? (
                <img
                  src={generatedCoverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            {/* 播放控制 */}
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-gray-900 truncate">
                {generatedTitle || `${theme?.label}之歌`}
              </h4>

              {/* 进度条 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full"
                />
                <span className="text-xs text-gray-500 w-10">{formatTime(audioDuration)}</span>
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  title="下载"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 隐藏的 audio 元素 */}
          <audio
            ref={audioRef}
            src={generatedAudioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          className="w-full py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重新生成歌曲
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

        <div className="flex flex-wrap gap-2">
          {/* Theme */}
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
            {theme?.icon} {theme?.label}
          </span>

          {/* Mood */}
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
            {mood?.icon} {mood?.label}
          </span>

          {/* Vocal */}
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
            {vocal?.icon} {vocal?.label}
          </span>
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

      {/* 歌曲标题 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">歌曲标题</label>
          <span className="text-xs text-gray-400">(可选)</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`${theme?.label || '我的'}之歌`}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
          maxLength={100}
        />
      </div>

      {/* 音乐风格 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">音乐风格</label>
          <span className="text-xs text-gray-400">(可选)</span>
        </div>
        <div className="relative">
          <textarea
            value={style}
            onChange={(e) => onStyleChange(e.target.value)}
            placeholder="pop, ballad, acoustic, piano..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm resize-none"
            rows={2}
            maxLength={500}
          />
          {onGenerateStyle && (
            <button
              type="button"
              onClick={onGenerateStyle}
              disabled={isGeneratingStyle}
              className="absolute right-2 bottom-2 px-3 py-1.5 bg-pink-100 text-pink-600 rounded-lg text-xs font-medium hover:bg-pink-200 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3" />
              {isGeneratingStyle ? '生成中...' : 'AI 生成'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          提示：可以输入流行、摇滚、爵士、电子等风格关键词
        </p>
      </div>

      {/* 声音性别 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">声音</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onVocalGenderChange('')}
            className={`
              p-3 rounded-xl border-2 transition-all text-center
              ${
                vocalGender === ''
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
              }
            `}
          >
            <div className="text-xl mb-1">🎵</div>
            <div className="text-sm font-medium">自动</div>
          </button>
          <button
            type="button"
            onClick={() => onVocalGenderChange('m')}
            className={`
              p-3 rounded-xl border-2 transition-all text-center
              ${
                vocalGender === 'm'
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
              }
            `}
          >
            <div className="text-xl mb-1">👨</div>
            <div className="text-sm font-medium">男声</div>
          </button>
          <button
            type="button"
            onClick={() => onVocalGenderChange('f')}
            className={`
              p-3 rounded-xl border-2 transition-all text-center
              ${
                vocalGender === 'f'
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
              }
            `}
          >
            <div className="text-xl mb-1">👩</div>
            <div className="text-sm font-medium">女声</div>
          </button>
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