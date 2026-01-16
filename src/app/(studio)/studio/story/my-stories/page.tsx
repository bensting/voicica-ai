'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Volume2, Image, MoreVertical, Trash2, Clock, FileText, Play, Pause, Loader2, X, Pencil, AlertTriangle, Download, Sparkles, ImageIcon, LayoutGrid, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getUserStories, deleteStory } from '@/actions/story';
import type { UserStory } from '@/actions/story';
import { generateIllustrations, getStoryIllustrations } from '@/actions/illustration';
import type { IllustrationType, IllustrationData } from '@/actions/illustration';
import LoginModal from '@/components/features/auth/LoginModal';

/**
 * Audio Generation Confirm Modal
 */
function AudioConfirmModal({
  story,
  isOpen,
  onClose,
  onConfirm,
  t,
}: {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}) {
  if (!isOpen || !story) return null;

  // Truncate content for preview
  const previewContent = story.content.length > 200
    ? story.content.substring(0, 200) + '...'
    : story.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('story.confirmAudioTitle') || 'Generate Audio'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Story Title */}
          <div>
            <p className="text-sm text-gray-500 mb-1">{t('story.title') || 'Title'}</p>
            <p className="font-medium text-gray-900">{story.title}</p>
          </div>

          {/* Content Preview */}
          <div>
            <p className="text-sm text-gray-500 mb-1">{t('story.contentPreview') || 'Content Preview'}</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {previewContent}
            </p>
          </div>

          {/* Character Count */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {story.wordCount} {t('story.characters') || 'characters'}
            </span>
          </div>

          {/* Info Message */}
          <p className="text-xs text-gray-500">
            {t('story.audioConfirmMessage') || 'You will be redirected to the TTS page to select a voice and generate audio.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all shadow-sm"
          >
            {t('common.confirm') || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Delete Confirm Modal
 */
function DeleteConfirmModal({
  story,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  t,
}: {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  t: (key: string) => string;
}) {
  if (!isOpen || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Icon */}
        <div className="pt-6 flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('story.deleteConfirmTitle') || 'Delete Story'}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            {t('story.deleteConfirmMessage') || 'Are you sure you want to delete this story?'}
          </p>
          <p className="text-sm font-medium text-gray-800 truncate">
            &quot;{story.title}&quot;
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('story.deleteWarning') || 'This action cannot be undone.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.deleting') || 'Deleting...'}
              </>
            ) : (
              t('common.delete') || 'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Illustration Generation Modal
 */
function IllustrationModal({
  story,
  isOpen,
  onClose,
  onSuccess,
  t,
}: {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}) {
  const [selectedType, setSelectedType] = useState<IllustrationType>('all');
  const [sceneCount, setSceneCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sceneCountOptions = [2, 4, 6, 8, 10];

  if (!isOpen || !story) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(t('story.illustration.extractingScenes') || 'Analyzing story...');

    try {
      const result = await generateIllustrations({
        storyId: story.id,
        type: selectedType,
        sceneCount: sceneCount,
      });

      if (result.success) {
        setProgress(t('story.illustration.complete') || 'Complete!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        if (result.errorCode === 'INSUFFICIENT_CREDITS') {
          setError(
            t('story.illustration.insufficientCredits')?.replace(
              '{required}',
              String(result.errorData?.required || 0)
            ) || `Insufficient credits. Need ${result.errorData?.required || 0} credits.`
          );
        } else {
          setError(result.error || 'Failed to generate illustrations');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total images based on type and scene count
  const getTotalCount = (type: IllustrationType) => {
    if (type === 'cover') return 1;
    if (type === 'scene') return sceneCount;
    return sceneCount + 1; // all = cover + scenes
  };

  const typeOptions = [
    {
      value: 'all' as IllustrationType,
      label: t('story.illustration.typeCoverAndScenes') || 'Cover + Scenes',
      description: `1 ${t('story.illustration.cover') || 'cover'} + ${sceneCount} ${t('story.illustration.scenes') || 'scenes'}`,
      icon: LayoutGrid,
    },
    {
      value: 'cover' as IllustrationType,
      label: t('story.illustration.typeCover') || 'Cover Only',
      description: t('story.illustration.typeCoverDesc') || '1 story cover illustration',
      icon: ImageIcon,
    },
    {
      value: 'scene' as IllustrationType,
      label: t('story.illustration.typeScenes') || 'Scenes Only',
      description: `${sceneCount} ${t('story.illustration.keyScenes') || 'key scene illustrations'}`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('story.illustration.title') || 'Generate Illustrations'}
          </h3>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Story Info */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-800 truncate">{story.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {story.wordCount} {t('story.characters') || 'characters'}
            </p>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {t('story.illustration.selectType') || 'Select generation type'}
            </p>
            <div className="space-y-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  disabled={isGenerating}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedType === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedType === option.value ? 'bg-purple-500' : 'bg-gray-100'
                    }`}
                  >
                    <option.icon
                      className={`w-5 h-5 ${
                        selectedType === option.value ? 'text-white' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                  {selectedType === option.value && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scene Count Selection - only show when scenes are included */}
          {selectedType !== 'cover' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {t('story.illustration.sceneCount') || 'Number of scenes'}
              </p>
              <div className="flex gap-2">
                {sceneCountOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => setSceneCount(count)}
                    disabled={isGenerating}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      sceneCount === count
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {t('story.illustration.totalImages') || 'Total'}: {getTotalCount(selectedType)} {t('story.illustration.images') || 'images'}
              </p>
            </div>
          )}

          {/* Progress / Error */}
          {isGenerating && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              <p className="text-sm text-purple-700">{progress}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-gray-500">
            {t('story.illustration.info') || 'AI will analyze your story and generate beautiful illustrations automatically.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('story.illustration.generating') || 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('story.illustration.generate') || 'Generate'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Illustration Gallery Modal
 */
function IllustrationGalleryModal({
  story,
  isOpen,
  onClose,
  onGenerate,
  t,
}: {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  t: (key: string) => string;
}) {
  const [illustrations, setIllustrations] = useState<IllustrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<IllustrationData | null>(null);

  useEffect(() => {
    if (isOpen && story) {
      loadIllustrations();
    }
  }, [isOpen, story]);

  const loadIllustrations = async () => {
    if (!story) return;
    setIsLoading(true);
    try {
      const result = await getStoryIllustrations(story.id);
      if (result.success && result.illustrations) {
        setIllustrations(result.illustrations);
      }
    } catch (err) {
      console.error('Failed to load illustrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (illustration: IllustrationData) => {
    if (!illustration.imageUrl) return;

    try {
      const response = await fetch(illustration.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `illustration-${illustration.position + 1}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  const handleDownloadAll = async () => {
    for (const ill of illustrations.filter((i) => i.imageUrl && i.status === 'completed')) {
      await handleDownload(ill);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  if (!isOpen || !story) return null;

  const completedIllustrations = illustrations.filter((i) => i.status === 'completed' && i.imageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('story.illustration.galleryTitle') || 'Illustrations'}
            </h3>
            <p className="text-sm text-gray-500 truncate">{story.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : illustrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-gray-600 mb-4">
                {t('story.illustration.noIllustrations') || 'No illustrations yet'}
              </p>
              <button
                onClick={onGenerate}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl transition-all"
              >
                {t('story.illustration.generateFirst') || 'Generate Illustrations'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {illustrations.map((illustration) => (
                <div
                  key={illustration.id}
                  className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square"
                >
                  {illustration.status === 'completed' && illustration.imageUrl ? (
                    <>
                      <img
                        src={illustration.imageUrl}
                        alt={illustration.sceneDescription || 'Illustration'}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(illustration)}
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleDownload(illustration)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-white/90 rounded-full">
                          {illustration.type === 'cover'
                            ? t('story.illustration.cover') || 'Cover'
                            : `#${illustration.position}`}
                        </span>
                      </div>
                    </>
                  ) : illustration.status === 'processing' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {completedIllustrations.length > 0 && (
          <div className="flex gap-3 p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onGenerate}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t('story.illustration.regenerate') || 'Regenerate'}
            </button>
            <button
              onClick={handleDownloadAll}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('story.illustration.downloadAll') || 'Download All'}
            </button>
          </div>
        )}
      </div>

      {/* Full Image View */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage.imageUrl || ''}
            alt={selectedImage.sceneDescription || 'Illustration'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(selectedImage);
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-100"
          >
            <Download className="w-4 h-4" />
            {t('common.download') || 'Download'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Story Card Component
 */
function StoryCard({
  story,
  onGenerateAudio,
  onGenerateIllustration,
  onEdit,
  onDelete,
  t,
}: {
  story: UserStory;
  onGenerateAudio: (story: UserStory) => void;
  onGenerateIllustration: (story: UserStory) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (story: UserStory) => void;
  t: (key: string) => string;
}) {
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
            <Image className="w-3.5 h-3.5" />
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
                <img
                  src={ill.imageUrl}
                  alt={ill.type === 'cover' ? 'Cover' : `Scene ${ill.position}`}
                  className="w-full h-full object-cover"
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
          <Image className="w-4 h-4" />
          {t('story.generateIllustration') || 'Illustration'}
        </button>
      </div>
    </div>
  );
}

/**
 * My Stories Page
 *
 * 显示用户生成的故事列表
 */
export default function MyStoriesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { user } = useFirebaseAuth();

  // State
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [audioConfirmStory, setAudioConfirmStory] = useState<UserStory | null>(null);
  const [deleteConfirmStory, setDeleteConfirmStory] = useState<UserStory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [illustrationStory, setIllustrationStory] = useState<UserStory | null>(null);
  const [galleryStory, setGalleryStory] = useState<UserStory | null>(null);

  // 设置页面标题
  useEffect(() => {
    setTitle(t('story.myStoriesTitle') || 'My Stories');
  }, [t, setTitle]);

  // 获取故事列表
  useEffect(() => {
    const fetchStories = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getUserStories();

        if (!result.success) {
          if (result.errorCode === 'LOGIN_REQUIRED') {
            setIsLoginModalOpen(true);
          } else {
            setError(result.error || 'Failed to fetch stories');
          }
          return;
        }

        setStories(result.stories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [user]);

  // Action handlers
  const handleGenerateAudio = (story: UserStory) => {
    // 打开确认弹窗
    setAudioConfirmStory(story);
  };

  const handleConfirmGenerateAudio = () => {
    if (!audioConfirmStory) return;

    // Save story content to localStorage for TTS page to pick up
    localStorage.setItem('lastTTSInputText', audioConfirmStory.content);
    // Save story ID to sessionStorage for TTS to link the audio
    sessionStorage.setItem('ttsStoryId', audioConfirmStory.id);
    // Close modal
    setAudioConfirmStory(null);
    // Navigate to TTS page
    router.push('/studio/tts');
  };

  const handleGenerateIllustration = (story: UserStory) => {
    // Check if story already has illustrations
    if (story.illustrationCount > 0) {
      // Open gallery first
      setGalleryStory(story);
    } else {
      // Open generation modal
      setIllustrationStory(story);
    }
  };

  const handleIllustrationSuccess = () => {
    // After successful generation, open the gallery
    if (illustrationStory) {
      setGalleryStory(illustrationStory);
      setIllustrationStory(null);
    }
  };

  const handleOpenIllustrationModal = () => {
    // Called from gallery to regenerate
    if (galleryStory) {
      setIllustrationStory(galleryStory);
      setGalleryStory(null);
    }
  };

  const handleEdit = (story: UserStory) => {
    // TODO: Navigate to edit page or open edit modal
    console.log('Edit story:', story.title);
    // For now, we could navigate to generate page with pre-filled content
    // router.push(`/studio/story/edit/${story.id}`);
  };

  const handleDelete = (story: UserStory) => {
    setDeleteConfirmStory(story);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmStory) return;

    setIsDeleting(true);
    try {
      const result = await deleteStory(deleteConfirmStory.id);

      if (result.success) {
        // Remove from local state
        setStories((prev) => prev.filter((s) => s.id !== deleteConfirmStory.id));
        setDeleteConfirmStory(null);
      } else {
        console.error('Failed to delete story:', result.error);
        // Could show error toast here
      }
    } catch (err) {
      console.error('Error deleting story:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Empty state component
  const EmptyState = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="text-center">
      <div className={`${mobile ? 'w-20 h-20' : 'w-24 h-24'} mx-auto mb-4 lg:mb-6 bg-purple-100 rounded-full flex items-center justify-center`}>
        <BookOpen className={`${mobile ? 'w-10 h-10' : 'w-12 h-12'} text-purple-500`} />
      </div>
      <h2 className={`${mobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-800 mb-2`}>
        {t('story.noStories') || 'No stories yet'}
      </h2>
      <p className={`text-gray-500 ${mobile ? 'text-sm' : ''}`}>
        {t('story.noStoriesDesc') || 'Your generated stories will appear here'}
      </p>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  // Stories grid component
  const StoriesGrid = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`grid gap-4 ${mobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onGenerateAudio={handleGenerateAudio}
          onGenerateIllustration={handleGenerateIllustration}
          onEdit={handleEdit}
          onDelete={handleDelete}
          t={t}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white" style={{ top: 'calc(60px + var(--safe-area-inset-top, 0px))', bottom: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }}>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            {isLoading ? (
              <LoadingState />
            ) : stories.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState mobile />
              </div>
            ) : (
              <StoriesGrid mobile />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('story.myStoriesTitle') || 'My Stories'}
            </h1>
            <p className="text-gray-500">
              {t('story.myStoriesSubtitle') || 'View and manage your generated stories'}
            </p>
          </div>

          {/* Stories List / Empty State */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <LoadingState />
            ) : stories.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EmptyState />
              </div>
            ) : (
              <StoriesGrid />
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Audio Confirm Modal */}
      <AudioConfirmModal
        story={audioConfirmStory}
        isOpen={!!audioConfirmStory}
        onClose={() => setAudioConfirmStory(null)}
        onConfirm={handleConfirmGenerateAudio}
        t={t}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        story={deleteConfirmStory}
        isOpen={!!deleteConfirmStory}
        onClose={() => setDeleteConfirmStory(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        t={t}
      />

      {/* Illustration Generation Modal */}
      <IllustrationModal
        story={illustrationStory}
        isOpen={!!illustrationStory}
        onClose={() => setIllustrationStory(null)}
        onSuccess={handleIllustrationSuccess}
        t={t}
      />

      {/* Illustration Gallery Modal */}
      <IllustrationGalleryModal
        story={galleryStory}
        isOpen={!!galleryStory}
        onClose={() => setGalleryStory(null)}
        onGenerate={handleOpenIllustrationModal}
        t={t}
      />
    </>
  );
}
