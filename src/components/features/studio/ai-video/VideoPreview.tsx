'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Film, Download, Share2, Loader2 } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl?: string | null;
  isGenerating?: boolean;
  progress?: number;
  onDownload?: () => void;
  onShare?: () => void;
}

/**
 * Video preview/player component
 */
export default function VideoPreview({
  videoUrl,
  isGenerating = false,
  progress = 0,
  onDownload,
  onShare,
}: VideoPreviewProps) {
  const { t } = useLanguage();

  // Empty state
  if (!videoUrl && !isGenerating) {
    return (
      <div className="bg-gray-900 rounded-2xl aspect-video flex flex-col items-center justify-center text-gray-400">
        <Film className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-sm">{t('video.previewPlaceholder')}</p>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="bg-gray-900 rounded-2xl aspect-video flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-white font-medium">{t('video.generatingVideo')}</p>
          <div className="w-48 bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm">{progress}%</p>
        </div>
      </div>
    );
  }

  // Video player
  return (
    <div className="relative">
      <video
        src={videoUrl!}
        controls
        className="w-full rounded-2xl bg-black aspect-video"
        playsInline
      >
        {t('video.browserNotSupported')}
      </video>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t('common.download')}</span>
          </button>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('common.share')}</span>
          </button>
        )}
      </div>
    </div>
  );
}