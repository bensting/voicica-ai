'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Volume2,
  Image as ImageLucide,
  MoreVertical,
  Trash2,
  Clock,
  FileText,
  Play,
  Pause,
  Pencil,
} from 'lucide-react';
import type { UserStory } from '@/actions/story';

interface StoryCardProps {
  story: UserStory;
  onOpenMedia: (story: UserStory) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (story: UserStory) => void;
  t: (key: string) => string;
}

export default function StoryCard({
  story,
  onOpenMedia,
  onEdit,
  onDelete,
  t,
}: StoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 获取段落音频信息
  const paragraphsWithAudio = (story.paragraphs || []).filter(
    (p) => p.audioUrl && p.audioStatus === 'completed'
  );
  const firstParagraphAudio = paragraphsWithAudio[0];
  const paragraphAudioCount = paragraphsWithAudio.length;

  // 计算总时长（所有段落音频时长之和）
  const totalAudioDuration = paragraphsWithAudio.reduce(
    (sum, p) => sum + (p.audioDuration || 0),
    0
  );

  // Check if audio is ready to play (基于段落音频)
  const hasAudio = !!firstParagraphAudio;

  // 获取段落插图信息
  const paragraphsWithIllustration = (story.paragraphs || []).filter(
    (p) => p.illustrationUrl && p.illustrationStatus === 'completed'
  );
  const paragraphIllustrationCount = paragraphsWithIllustration.length;

  // Handle audio playback (使用第一个段落音频)
  const handlePlayAudio = () => {
    if (!firstParagraphAudio?.audioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      // Create new audio element or reuse existing
      let audio = audioElement;
      if (!audio) {
        audio = new Audio(firstParagraphAudio.audioUrl);
        audio.onended = () => setIsPlaying(false);
        setAudioElement(audio);
      }
      audio.play();
      setIsPlaying(true);
    }
  };

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1">
            {story.title}
          </h3>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(story);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {t('common.edit') || 'Edit'}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(story);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body - Content Preview */}
      <div className="p-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {truncateContent(story.content, 150)}
        </p>
      </div>

      {/* Card Meta */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(story.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {story.wordCount} {t('story.characters') || 'chars'}
        </span>
        {paragraphAudioCount > 0 && (
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            {paragraphAudioCount}
          </span>
        )}
        {paragraphIllustrationCount > 0 && (
          <span className="flex items-center gap-1">
            <ImageLucide className="w-3.5 h-3.5" />
            {paragraphIllustrationCount}
          </span>
        )}
      </div>

      {/* Paragraph Illustration Thumbnails */}
      {paragraphsWithIllustration.length > 0 && (
        <div className="px-4 pb-3">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide cursor-pointer"
            onClick={() => onOpenMedia(story)}
          >
            {paragraphsWithIllustration.slice(0, 5).map((p, index) => (
              <div
                key={p.id}
                className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={p.illustrationUrl!}
                  alt={`Paragraph ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
            {paragraphIllustrationCount > 5 && (
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  +{paragraphIllustrationCount - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Player - show if has paragraph audio */}
      {hasAudio && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-xl">
            <button
              onClick={handlePlayAudio}
              className="w-9 h-9 flex items-center justify-center bg-purple-500 hover:bg-purple-600 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-purple-700 truncate">
                {paragraphAudioCount} {t('story.audio.paragraphs') || 'paragraphs'}
              </p>
              {totalAudioDuration > 0 && (
                <p className="text-xs text-purple-500">
                  {Math.floor(totalAudioDuration / 60)}:{String(Math.floor(totalAudioDuration % 60)).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onOpenMedia(story)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Volume2 className="w-4 h-4" />
          <ImageLucide className="w-4 h-4" />
          {t('story.media.button') || 'Audio & Illustrations'}
        </button>
      </div>
    </div>
  );
}