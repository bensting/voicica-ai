'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Download, Trash2, Play, Pause, Share2 } from 'lucide-react';
import type { Generation } from '@/types/tts';
import { TaskStatus } from '@/types/tts';
import ShareModal from '@/components/ui/ShareModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface GenerationRecordCardProps {
  generation: Generation;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  showActions?: boolean; // 是否显示删除/下载按钮
  size?: 'normal' | 'large'; // 卡片大小
}

/**
 * 单条生成记录卡片组件
 *
 * 可复用于：
 * - 桌面端历史记录列表
 * - 移动端弹窗
 */
export default function GenerationRecordCard({
  generation,
  onDelete,
  onDownload,
  showActions = true,
  size = 'normal',
}: GenerationRecordCardProps) {
  const { t } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0); // 播放进度 0-100
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isProcessing = generation.status === TaskStatus.PROCESSING || generation.status === TaskStatus.PENDING;
  const progress = generation.progress || 0;
  const isPlaying = playingId === generation.id;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = (id: string, audioUrl: string) => {
    if (!audioUrl) return;

    // If already playing this audio, pause it
    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Play new audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(id);
    setPlayProgress(0);

    // 更新播放进度
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setPlayProgress(progressPercent);
      }
    };

    audio.play().catch((err) => {
      console.error('Error playing audio:', err);
      setPlayingId(null);
      setPlayProgress(0);
    });

    audio.onended = () => {
      setPlayingId(null);
      setPlayProgress(0);
    };
  };

  // Size configurations
  const sizeConfig = {
    normal: {
      container: 'p-3',
      playButton: 'w-8 h-8',
      playIcon: 'w-4 h-4',
      spinner: 'w-5 h-5',
      avatar: 'w-6 h-6',
      text: 'text-sm',
      voiceText: 'text-xs',
      progressText: 'text-xs',
      progressBar: 'w-32 h-1',
      layout: 'flex-row',
    },
    large: {
      container: 'p-5',
      playButton: 'w-16 h-16',
      playIcon: 'w-8 h-8',
      spinner: 'w-9 h-9',
      avatar: 'w-12 h-12',
      text: 'text-lg',
      voiceText: 'text-base',
      progressText: 'text-base',
      progressBar: 'w-full h-2.5',
      layout: 'flex-col',
    },
  };

  const config = sizeConfig[size];

  // Large size uses vertical layout for better mobile UX
  if (size === 'large') {
    return (
      <div
        className={`flex flex-col gap-4 rounded-2xl transition-all ${config.container} ${
          isProcessing
            ? 'bg-purple-50 border-2 border-purple-200'
            : 'bg-white border border-gray-200'
        }`}
      >
        {/* Top section: Play button centered */}
        <div className="flex justify-center">
          <button
            onClick={() => !isProcessing && handlePlay(generation.id, generation.audioUrl || '')}
            className={`${config.playButton} flex items-center justify-center rounded-full transition-colors shadow-lg ${
              isProcessing
                ? 'bg-purple-100 cursor-not-allowed'
                : playingId === generation.id
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
            disabled={isProcessing || !generation.audioUrl}
          >
            {isProcessing ? (
              <div className={`${config.spinner} border-3 border-purple-600 border-t-transparent rounded-full animate-spin`} />
            ) : playingId === generation.id ? (
              <Pause className={config.playIcon} fill="currentColor" />
            ) : (
              <Play className={config.playIcon} fill="currentColor" />
            )}
          </button>
        </div>

        {/* Text Content - 单行显示,超出省略 */}
        <div className="text-center px-2">
          <p className={`${config.text} text-gray-900 font-medium truncate`}>{generation.text}</p>
        </div>

        {/* Voice Info + Duration - 同一行 */}
        <div className="flex items-center justify-between">
          {/* 左侧：头像和名字 */}
          <div className="flex items-center gap-2">
            {generation.voiceAvatar ? (
              <Image
                src={generation.voiceAvatar}
                alt={generation.voiceName || ''}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl">🎤</span>
              </div>
            )}
            <span className={`${config.voiceText} text-gray-700 font-medium`}>{generation.voiceDisplayName || generation.voiceName}</span>
          </div>

          {/* 右侧：时长/进度 */}
          <div className="text-right">
            <span className="text-xs text-gray-500 block">{isProcessing ? t('tts.progress') : t('tts.duration')}</span>
            <span className={`${config.progressText} font-semibold ${isProcessing ? 'text-purple-600' : 'text-gray-700'}`}>
              {isProcessing ? `${progress}%` : generation.duration ? `${generation.duration}s` : '-'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`${config.progressBar} bg-gray-200 rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all ${
              isProcessing ? 'bg-purple-600 duration-500' : isPlaying ? 'bg-purple-600 duration-100' : 'bg-purple-400 duration-500'
            }`}
            style={{ width: isProcessing ? `${progress}%` : isPlaying ? `${playProgress}%` : '100%' }}
          />
        </div>

        {/* Action Buttons - full width, icon only */}
        {showActions && !isProcessing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onDownload(generation.id)}
              className="flex-1 py-3 bg-purple-50 text-purple-600 font-medium rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-center"
              disabled={!generation.audioUrl}
              title={t('common.download')}
            >
              <Download className="w-5 h-5" />
            </button>
            {generation.shareId && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 py-3 bg-purple-50 text-purple-600 font-medium rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-center"
                title={t('common.share')}
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(generation.id);
              }}
              className="flex-1 py-3 bg-gray-50 text-gray-600 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
              title={t('common.delete')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Share Modal */}
        {generation.shareId && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            shareId={generation.shareId}
            text={generation.text}
          />
        )}
      </div>
    );
  }

  // Normal size uses horizontal layout
  return (
    <div
      className={`flex items-center gap-3 rounded-lg hover:shadow-sm transition-all ${config.container} ${
        isProcessing
          ? 'bg-purple-50 border-2 border-purple-200'
          : 'bg-white border border-gray-200 hover:border-purple-300'
      }`}
    >
      {/* Play/Pause Button or Spinning Icon */}
      <button
        onClick={() => !isProcessing && handlePlay(generation.id, generation.audioUrl || '')}
        className={`${config.playButton} flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
          isProcessing
            ? 'bg-purple-100 cursor-not-allowed'
            : playingId === generation.id
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
        }`}
        disabled={isProcessing || !generation.audioUrl}
      >
        {isProcessing ? (
          <div className={`${config.spinner} border-2 border-purple-600 border-t-transparent rounded-full animate-spin`} />
        ) : playingId === generation.id ? (
          <Pause className={config.playIcon} fill="currentColor" />
        ) : (
          <Play className={config.playIcon} fill="currentColor" />
        )}
      </button>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className={`${config.text} text-gray-900 truncate`}>{generation.text}</p>
      </div>

      {/* Voice Info */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {generation.voiceAvatar ? (
          <Image
            src={generation.voiceAvatar}
            alt={generation.voiceName || ''}
            width={24}
            height={24}
            className={`${config.avatar} rounded-full object-cover`}
          />
        ) : (
          <div className={`${config.avatar} rounded-full bg-purple-100 flex items-center justify-center`}>
            <span className={config.voiceText}>🎤</span>
          </div>
        )}
        <span className={`${config.voiceText} text-gray-600`}>{generation.voiceDisplayName || generation.voiceName}</span>
      </div>

      {/* Duration or Progress */}
      <div className={`${config.progressText} flex-shrink-0 min-w-[3.5rem] text-right`}>
        {isProcessing ? (
          <span className="text-purple-600 font-medium">{progress}%</span>
        ) : generation.duration ? (
          <span className="text-gray-500">{generation.duration}s</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`${config.progressBar} bg-gray-200 rounded-full flex-shrink-0 overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all ${
            isProcessing ? 'bg-purple-600 duration-500' : isPlaying ? 'bg-purple-600 duration-100' : 'bg-purple-400 duration-500'
          }`}
          style={{ width: isProcessing ? `${progress}%` : isPlaying ? `${playProgress}%` : '100%' }}
        />
      </div>

      {/* Action Buttons */}
      {showActions && (
        <>
          {/* Share Button */}
          {generation.shareId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
              title="Share"
              disabled={isProcessing || !generation.audioUrl}
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={() => onDownload(generation.id)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
            title="Download"
            disabled={isProcessing || !generation.audioUrl}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(generation.id);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Share Modal */}
      {generation.shareId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareId={generation.shareId}
          text={generation.text}
        />
      )}
    </div>
  );
}