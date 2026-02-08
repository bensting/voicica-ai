'use client';

import { useState, useEffect, useMemo } from 'react';
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
import DetailActionBar from './DetailActionBar';

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

  // 下载文件名
  const downloadFileName = useMemo(() => {
    const ext = selectedFormat ? getFormatExtension(selectedFormat) : 'mp4';
    return `${videoInfo.title || videoInfo.video_id}.${ext}`;
  }, [videoInfo, selectedFormat]);

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

        {/* Format pills - 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {currentFormats.map((format, index) => {
            const isSelected = selectedFormat?.format_id === format.format_id;
            const size = formatFileSize(format.filesize);
            return (
              <button
                key={`${format.format_id}-${index}`}
                onClick={() => setSelectedFormat(format)}
                disabled={!format.url}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:border-purple-500/30'
                } ${!format.url ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="truncate w-full text-center">{format.quality || format.format_id}</span>
                {size && <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>{size}</span>}
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
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              onClose();
              onSearchAnother();
            }}
            className="flex-[1] flex items-center justify-center gap-1.5 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white text-sm font-medium hover:bg-gray-700 transition-all"
          >
            {t('videoDownloader.searchAnother')}
          </button>
          <div className="flex-[2]">
            <DetailActionBar
              showRecreate={false}
              showDownload={true}
              fileUrl={selectedFormat?.url || undefined}
              fileName={downloadFileName}
              fileType="video"
              downloadText={t('videoDownloader.downloadButton')}
              showInterstitialOnDownload={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
