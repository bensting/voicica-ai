'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ParseResponse, VideoFormat } from '@/actions/video-downloader';
import {
  getGroupedFormats,
  formatFileSize,
  getFormatExtension,
  formatDuration,
  type FormatType,
} from '@/lib/services/youtube-downloader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBottomNav } from '@/contexts/BottomNavContext';
import DetailModalHeader from './DetailModalHeader';
import GradientButton from '@/components/native/common/GradientButton';
import { Download } from 'lucide-react';

interface VideoDownloaderDetailModalProps {
  videoInfo: ParseResponse;
  onClose: () => void;
  onSearchAnother: () => void;
}

export default function VideoDownloaderDetailModal({
  videoInfo,
  onClose,
  onSearchAnother,
}: VideoDownloaderDetailModalProps) {
  const { t } = useLanguage();
  const { hide, show } = useBottomNav();

  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [activeTab, setActiveTab] = useState<FormatType>('video_with_audio');
  const [downloading, setDownloading] = useState(false);

  // Hide bottom nav
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  const groupedFormats = useMemo(() => {
    return getGroupedFormats(videoInfo.formats);
  }, [videoInfo]);

  const currentFormats = useMemo(() => {
    switch (activeTab) {
      case 'video_with_audio': return groupedFormats.videoWithAudio;
      case 'video_only': return groupedFormats.videoOnly;
      case 'audio_only': return groupedFormats.audioOnly;
      default: return [];
    }
  }, [groupedFormats, activeTab]);

  const tabs = useMemo(() => {
    return [
      { id: 'video_with_audio' as FormatType, label: t('videoDownloader.tabs.videoWithAudio'), count: groupedFormats.videoWithAudio.length },
      { id: 'video_only' as FormatType, label: t('videoDownloader.tabs.videoOnly'), count: groupedFormats.videoOnly.length },
      { id: 'audio_only' as FormatType, label: t('videoDownloader.tabs.audioOnly'), count: groupedFormats.audioOnly.length },
    ].filter(tab => tab.count > 0);
  }, [groupedFormats, t]);

  // Auto-select first format on mount and tab change
  useEffect(() => {
    if (currentFormats.length > 0 && !currentFormats.find(f => f.format_id === selectedFormat?.format_id)) {
      setSelectedFormat(currentFormats[0]);
    }
  }, [activeTab, currentFormats, selectedFormat]);

  // Auto-select first available tab on mount
  useEffect(() => {
    if (groupedFormats.videoWithAudio.length > 0) {
      setActiveTab('video_with_audio');
    } else if (groupedFormats.audioOnly.length > 0) {
      setActiveTab('audio_only');
    } else if (groupedFormats.videoOnly.length > 0) {
      setActiveTab('video_only');
    }
  }, [groupedFormats]);

  const handleDownload = useCallback(() => {
    if (!selectedFormat?.url || downloading) return;
    setDownloading(true);

    const ext = getFormatExtension(selectedFormat);
    const filename = `${videoInfo.title || videoInfo.video_id}.${ext}`;
    const a = document.createElement('a');
    a.href = selectedFormat.url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloading(false), 2000);
  }, [videoInfo, selectedFormat, downloading]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <DetailModalHeader onClose={onClose} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Video info card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3 mb-4">
          <div className="flex gap-3">
            {/* Thumbnail */}
            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/80 to-blue-600/80">
              {videoInfo.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={videoInfo.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title + Author */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">
                {videoInfo.title || t('videoDownloader.untitled')}
              </h3>
              {videoInfo.author && (
                <p className="text-xs text-gray-500 mt-1 truncate">{videoInfo.author}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
                  YouTube
                </span>
                {videoInfo.duration_seconds && (
                  <span className="text-[10px] text-gray-500">
                    {formatDuration(videoInfo.duration_seconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        {tabs.length > 1 && (
          <div className="flex gap-2 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {/* Format pills */}
        <div className="flex flex-wrap gap-2">
          {currentFormats.map((format, index) => {
            const isSelected = selectedFormat?.format_id === format.format_id;
            const size = formatFileSize(format.filesize);
            return (
              <button
                key={`${format.format_id}-${index}`}
                onClick={() => setSelectedFormat(format)}
                disabled={!format.url}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:border-purple-500/30'
                } ${!format.url ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>{format.quality || format.format_id}</span>
                {size && <span className={isSelected ? 'text-white/70' : 'text-gray-500'}>({size})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom fixed action area */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a] to-transparent"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              onSearchAnother();
            }}
            className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
          >
            {t('videoDownloader.searchAnother')}
          </button>
          <div className="flex-[2]">
            <GradientButton
              onClick={handleDownload}
              disabled={!selectedFormat?.url || downloading}
              icon={Download}
              className="py-3 rounded-xl"
            >
              {downloading ? t('videoDownloader.downloading') : t('videoDownloader.downloadButton')}
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}
