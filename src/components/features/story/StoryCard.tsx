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
  Loader2,
  Pencil,
} from 'lucide-react';
import type { UserStory } from '@/actions/story';

interface StoryCardProps {
  story: UserStory;
  onGenerateAudio: (story: UserStory) => void;
  onGenerateIllustration: (story: UserStory) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (story: UserStory) => void;
  t: (key: string) => string;
}

export default function StoryCard({
  story,
  onGenerateAudio,
  onGenerateIllustration,
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

  // Handle audio playback
  const handlePlayAudio = () => {
    if (!story.latestAudio?.audioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      // Create new audio element or reuse existing
      let audio = audioElement;
      if (!audio) {
        audio = new Audio(story.latestAudio.audioUrl);
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

  // Check if audio is ready to play
  const hasAudio = story.latestAudio?.audioUrl && story.latestAudio.status === 'SUCCESS';
  const isAudioProcessing = story.latestAudio && ['PENDING', 'PROCESSING'].includes(story.latestAudio.status);

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
        {story.audioCount > 0 && (
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            {story.audioCount}
          </span>
        )}
        {story.illustrationCount > 0 && (
          <span className="flex items-center gap-1">
            <ImageLucide className="w-3.5 h-3.5" />
            {story.illustrationCount}
          </span>
        )}
      </div>

      {/* Illustration Thumbnails */}
      {story.illustrations && story.illustrations.length > 0 && (
        <div className="px-4 pb-3">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide cursor-pointer"
            onClick={() => onGenerateIllustration(story)}
          >
            {story.illustrations.map((ill) => (
              <div
                key={ill.id}
                className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={ill.imageUrl}
                  alt={ill.type === 'cover' ? 'Cover' : `Scene ${ill.position}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {ill.type === 'cover' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-0.5">
                    <span className="text-[10px] text-white block text-center">
                      {t('story.illustration.cover') || 'Cover'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {story.illustrationCount > story.illustrations.length && (
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  +{story.illustrationCount - story.illustrations.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Player - show if has audio */}
      {(hasAudio || isAudioProcessing) && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-xl">
            {isAudioProcessing ? (
              <div className="w-9 h-9 flex items-center justify-center bg-purple-100 rounded-full">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              </div>
            ) : (
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
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-purple-700 truncate">
                {isAudioProcessing
                  ? (t('story.audioProcessing') || 'Processing...')
                  : story.latestAudio?.voiceName
                }
              </p>
              {story.latestAudio?.duration && (
                <p className="text-xs text-purple-500">
                  {Math.floor(story.latestAudio.duration / 60)}:{String(Math.floor(story.latestAudio.duration % 60)).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onGenerateAudio(story)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Volume2 className="w-4 h-4" />
          {t('story.generateAudio') || 'Audio'}
        </button>
        <button
          onClick={() => onGenerateIllustration(story)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <ImageLucide className="w-4 h-4" />
          {t('story.generateIllustration') || 'Illustration'}
        </button>
      </div>
    </div>
  );
}