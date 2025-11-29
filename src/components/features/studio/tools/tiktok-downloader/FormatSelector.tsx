/**
 * TikTok Video Format Selector Component
 *
 * 视频格式选择器
 */

import type { VideoFormat } from '@/actions/video-downloader';
import { formatFileSize } from '@/lib/services/tiktok-downloader';

interface FormatSelectorProps {
  formats: VideoFormat[];
  selectedFormat: VideoFormat | null;
  onSelectFormat: (format: VideoFormat) => void;
  selectQualityText: string;
  variant?: 'mobile' | 'desktop';
}

export default function FormatSelector({
  formats,
  selectedFormat,
  onSelectFormat,
  selectQualityText,
  variant = 'mobile',
}: FormatSelectorProps) {
  if (variant === 'mobile') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">{selectQualityText}</h4>
        <div className="flex flex-col gap-2">
          {formats.map((format) => (
            <button
              key={format.format_id}
              onClick={() => onSelectFormat(format)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                selectedFormat?.format_id === format.format_id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{format.quality}</span>
                {format.note && (
                  <span className="text-xs text-gray-500">({format.note})</span>
                )}
              </div>
              {format.filesize && (
                <span className="text-sm text-gray-500">{formatFileSize(format.filesize)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">{selectQualityText}</span>
      <div className="flex flex-wrap gap-2">
        {formats.map((format) => (
          <button
            key={format.format_id}
            onClick={() => onSelectFormat(format)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              selectedFormat?.format_id === format.format_id
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-purple-300 text-gray-600'
            }`}
          >
            <span className="font-medium">{format.quality}</span>
            {format.note && (
              <span className="text-xs text-gray-400 ml-1">({format.note})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}