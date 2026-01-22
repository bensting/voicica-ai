'use client';

import { useState } from 'react';
import {
  Loader2,
  X,
  AlertTriangle,
  Sparkles,
  ImageIcon,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { generateIllustrations } from '@/actions/illustration';
import type { IllustrationType } from '@/actions/illustration';
import type { UserStory } from '@/actions/story';

interface IllustrationModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

export default function IllustrationModal({
  story,
  isOpen,
  onClose,
  onSuccess,
  t,
}: IllustrationModalProps) {
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