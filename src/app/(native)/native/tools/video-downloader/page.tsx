'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import {
  parseVideoUrl,
  type ParseResponse,
  type VideoFormat,
} from '@/actions/video-downloader';
import {
  isYouTubeUrl,
  getGroupedFormats,
  getFormatExtension,
  formatFileSize,
  type FormatType,
} from '@/lib/services/youtube-downloader';
import { getVideoParseErrorMessage } from '@/lib/services/video-downloader-utils';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';

/**
 * Video Downloader 页面 (Native) - YouTube only
 * 暗色风格，pill 搜索栏，紧凑视频卡片，格式药丸按钮
 */
export default function VideoDownloaderPage() {
  const { t } = useLanguage();
  const { refreshCredits } = useCredits();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<ParseResponse | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [activeTab, setActiveTab] = useState<FormatType>('video_with_audio');

  // 积分成本
  const creditCost = useMemo(() => {
    return calculateProductCreditsCost(ProductType.YOUTUBE_DOWNLOADER);
  }, []);

  // YouTube 分组格式
  const groupedFormats = useMemo(() => {
    if (!videoInfo) return null;
    return getGroupedFormats(videoInfo.formats);
  }, [videoInfo]);

  const currentFormats = useMemo(() => {
    if (!groupedFormats) return [];
    switch (activeTab) {
      case 'video_with_audio': return groupedFormats.videoWithAudio;
      case 'video_only': return groupedFormats.videoOnly;
      case 'audio_only': return groupedFormats.audioOnly;
      default: return [];
    }
  }, [groupedFormats, activeTab]);

  const tabs = useMemo(() => {
    if (!groupedFormats) return [];
    return [
      { id: 'video_with_audio' as FormatType, label: t('videoDownloader.tabs.videoWithAudio'), count: groupedFormats.videoWithAudio.length },
      { id: 'video_only' as FormatType, label: t('videoDownloader.tabs.videoOnly'), count: groupedFormats.videoOnly.length },
      { id: 'audio_only' as FormatType, label: t('videoDownloader.tabs.audioOnly'), count: groupedFormats.audioOnly.length },
    ].filter(tab => tab.count > 0);
  }, [groupedFormats, t]);

  const handleClear = useCallback(() => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
  }, []);

  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError(t('videoDownloader.errors.emptyUrl'));
      return;
    }
    if (!isYouTubeUrl(url)) {
      setError(t('videoDownloader.errors.invalidUrl'));
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat(null);

    try {
      const result = await parseVideoUrl(url);
      if (!result.success || !result.data) {
        const errorCode = result.errorCode || 'UNKNOWN_ERROR';
        setError(getVideoParseErrorMessage(errorCode, result.errorData, t, 'videoDownloader'));
        return;
      }

      setVideoInfo(result.data);
      await refreshCredits();

      const grouped = getGroupedFormats(result.data.formats);
      if (grouped.videoWithAudio.length > 0) {
        setActiveTab('video_with_audio');
        setSelectedFormat(grouped.videoWithAudio[0]);
      } else if (grouped.audioOnly.length > 0) {
        setActiveTab('audio_only');
        setSelectedFormat(grouped.audioOnly[0]);
      } else if (grouped.videoOnly.length > 0) {
        setActiveTab('video_only');
        setSelectedFormat(grouped.videoOnly[0]);
      }
    } catch {
      setError(t('videoDownloader.errors.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [url, t, refreshCredits]);

  // Tab 切换时自动选中第一个格式
  useEffect(() => {
    if (currentFormats.length > 0 && !currentFormats.find(f => f.format_id === selectedFormat?.format_id)) {
      setSelectedFormat(currentFormats[0]);
    }
  }, [activeTab, currentFormats, selectedFormat]);

  const handleDownload = useCallback(() => {
    if (!videoInfo || !selectedFormat?.url || downloading) return;
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
    <div className="flex flex-col min-h-screen">
      <CreatePageHeader title={t('videoDownloader.title')} showCreateSheet={true} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <div className="flex flex-col gap-4">

          {/* ====== 搜索栏 (Pill Shape) ====== */}
          <div>
            <div className="flex items-center bg-white/5 border border-purple-500/30 rounded-full overflow-hidden focus-within:border-purple-500/60 transition-colors">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                placeholder={t('videoDownloader.urlPlaceholder')}
                className="flex-1 bg-transparent text-white placeholder-gray-500 px-5 py-3.5 text-sm focus:outline-none min-w-0"
              />
              {url && (
                <button onClick={handleClear} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleParse}
                disabled={loading || !url.trim()}
                className="m-1.5 w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                )}
              </button>
            </div>

            {/* YouTube 标识 */}
            {url.trim() && isYouTubeUrl(url) && !loading && !videoInfo && (
              <p className="mt-2 ml-4 text-xs text-purple-400">
                YouTube {t('videoDownloader.detected')}
              </p>
            )}
          </div>

          {/* ====== 积分提示 ====== */}
          {!videoInfo && !loading && (
            <p className="text-xs text-gray-600 text-center">
              {creditCost > 0
                ? `${creditCost} credits / ${t('videoDownloader.parseButton').toLowerCase()}`
                : 'Free'}
            </p>
          )}

          {/* ====== 解析中 ====== */}
          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              <p className="text-sm text-gray-400">{t('videoDownloader.parsing')}</p>
              <p className="text-xs text-gray-600">{t('videoDownloader.doNotClose')}</p>
            </div>
          )}

          {/* ====== 错误提示 ====== */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ====== 视频结果 ====== */}
          {videoInfo && (
            <div className="flex flex-col gap-3">

              {/* 视频信息卡片 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3">
                <div className="flex gap-3">
                  {/* 缩略图 */}
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

                  {/* 标题 + 作者 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">
                      {videoInfo.title || t('videoDownloader.untitled')}
                    </h3>
                    {videoInfo.author && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{videoInfo.author}</p>
                    )}
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
                        YouTube
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab 切换 */}
              {tabs.length > 1 && (
                <div className="flex gap-2">
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

              {/* 格式药丸选择 */}
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

              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                disabled={!selectedFormat?.url || downloading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-2xl font-medium hover:from-purple-700 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('videoDownloader.downloading')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    {t('videoDownloader.downloadButton')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ====== 空状态 ====== */}
          {!loading && !videoInfo && !error && (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <polygon points="10,6 16,10 10,14" fill="currentColor" stroke="none" />
                  <path d="M12 17v4m-3 0h6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center px-6">
                <h3 className="text-white font-medium mb-1">{t('videoDownloader.emptyTitle')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t('videoDownloader.emptyDescription')}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
