'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Share2 } from 'lucide-react';
import ShareModal from '@/components/ui/ShareModal';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string;
  voiceName?: string;
  voiceAvatar?: string;
  shareId?: string;
  text?: string;
}

/**
 * 底部弹出的音频播放器组件
 *
 * Mobile-optimized bottom sheet audio player
 */
export default function AudioPlayerModal({
  isOpen,
  onClose,
  audioUrl,
  voiceName = '晓臻',
  voiceAvatar,
  shareId,
  text,
}: AudioPlayerModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log('🎵 音频开始播放');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('⏸️ 音频暂停');
      setIsPlaying(false);
    };
    const handleEnded = () => {
      console.log('✅ 音频播放结束');
      setIsPlaying(false);
    };
    const handleError = (e: Event) => {
      console.error('❌ 音频加载错误:', e);
      console.error('音频 URL:', audioUrl);
      const target = e.target as HTMLAudioElement;
      if (target.error) {
        console.error('错误代码:', target.error.code);
        console.error('错误信息:', target.error.message);
      }
    };
    const handleLoadedData = () => {
      console.log('✅ 音频加载成功:', audioUrl);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);

    // 加载音频
    audio.load();

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [audioUrl]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待动画完成
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error('播放错误:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[60] ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 底部弹出面板 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[70] transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 顶部拖动条 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 内容区域 */}
        <div className="px-6 pb-8">
          {/* 语音信息 */}
          <div className="flex items-center gap-4 mb-6">
            {/* 头像 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {voiceAvatar ? (
                <Image
                  src={voiceAvatar}
                  alt={voiceName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🎤</span>
              )}
            </div>

            {/* 语音名称 */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                生成成功
              </h3>
              <p className="text-sm text-gray-500">语音: {voiceName}</p>
            </div>
          </div>

          {/* 音频播放器 */}
          <div className="mb-6">
            <audio
              ref={audioRef}
              controls
              className="w-full"
              style={{
                filter: 'sepia(20%) saturate(70%) hue-rotate(220deg)',
              }}
              preload="auto"
            >
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {/* 播放/暂停按钮 */}
            <button
              onClick={togglePlay}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-full transition-all shadow-lg"
            >
              {isPlaying ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>播放</span>
                </>
              )}
            </button>

            {/* 下载按钮 */}
            <a
              href={audioUrl}
              download="ai-voice-output.mp3"
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border-2 border-purple-200 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-colors shadow-sm"
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
              <span>匯出</span>
            </a>

            {/* 分享按钮 */}
            {shareId && text && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border-2 border-purple-200 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-colors shadow-sm"
              >
                <Share2 className="w-5 h-5" />
                <span>分享</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareId && text && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareId={shareId}
          text={text}
        />
      )}
    </>
  );
}