/**
 * YouTube Format Selector Component
 *
 * 格式选择器组件（包含 Tab 和格式列表）
 */

import type { VideoFormat } from '@/actions/video-downloader';
import { formatFileSize } from '@/lib/services/youtube-downloader';
import type { FormatType } from '@/lib/services/youtube-downloader';

interface Tab {
  id: FormatType;
  label: string;
  count: number;
}

interface FormatSelectorProps {
  tabs: Tab[];
  activeTab: FormatType;
  onTabChange: (tab: FormatType) => void;
  currentFormats: VideoFormat[];
  selectedFormat: VideoFormat | null;
  onSelectFormat: (format: VideoFormat) => void;
  selectQualityText: string;
  variant?: 'mobile' | 'desktop';
}

export default function FormatSelector({
  tabs,
  activeTab,
  onTabChange,
  currentFormats,
  selectedFormat,
  onSelectFormat,
  selectQualityText,
  variant = 'mobile',
}: FormatSelectorProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4">
        {/* Tab 切换 */}
        {tabs.length > 1 && (
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 格式选择 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">{selectQualityText}</h4>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {currentFormats.map((format) => (
              <button
                key={format.format_id}
                onClick={() => onSelectFormat(format)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  selectedFormat?.format_id === format.format_id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{format.quality}</span>
                  <span className="text-xs text-gray-400">{format.ext}</span>
                </div>
                {format.filesize && (
                  <span className="text-sm text-gray-500">{formatFileSize(format.filesize)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tab 切换 */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* 格式选择 */}
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-700 block mb-3">{selectQualityText}</span>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {currentFormats.map((format) => (
            <button
              key={format.format_id}
              onClick={() => onSelectFormat(format)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                selectedFormat?.format_id === format.format_id
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-600'
              }`}
            >
              <span className="font-medium">{format.quality}</span>
              <span className="text-xs text-gray-400 ml-1">{format.ext}</span>
              {format.filesize && (
                <span className="text-xs text-gray-400 ml-1">({formatFileSize(format.filesize)})</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}