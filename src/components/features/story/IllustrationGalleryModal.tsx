'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Loader2,
  X,
  AlertTriangle,
  Download,
  Sparkles,
  ImageIcon,
} from 'lucide-react';
import { getStoryIllustrations } from '@/actions/illustration';
import type { IllustrationData } from '@/actions/illustration';
import type { UserStory } from '@/actions/story';

interface IllustrationGalleryModalProps {
  story: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  t: (key: string) => string;
}

export default function IllustrationGalleryModal({
  story,
  isOpen,
  onClose,
  onGenerate,
  t,
}: IllustrationGalleryModalProps) {
  const [illustrations, setIllustrations] = useState<IllustrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<IllustrationData | null>(null);

  const loadIllustrations = useCallback(async () => {
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
  }, [story]);

  useEffect(() => {
    if (isOpen && story) {
      loadIllustrations();
    }
  }, [isOpen, story, loadIllustrations]);

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
                      <Image
                        src={illustration.imageUrl}
                        alt={illustration.sceneDescription || 'Illustration'}
                        fill
                        unoptimized
                        className="object-cover cursor-pointer"
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
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image
              src={selectedImage.imageUrl || ''}
              alt={selectedImage.sceneDescription || 'Illustration'}
              fill
              unoptimized
              className="object-contain rounded-lg"
            />
          </div>
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