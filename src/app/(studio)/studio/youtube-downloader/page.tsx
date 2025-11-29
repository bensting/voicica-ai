'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import YouTubeIcon from '@/components/icons/YouTubeIcon';
import {
  parseVideoUrl,
  type ParseResponse,
  type VideoFormat,
} from '@/actions/video-downloader';
import {
  isYouTubeUrl,
  getGroupedFormats,
  formatFileSize,
  formatDuration,
  getFormatExtension,
  type FormatType,
} from '@/lib/services/youtube-downloader';

/**
 * YouTube Video Downloader Page
 *
 * 解析 YouTube 视频并提供下载功能
 * 支持视频（有音频）、纯视频、纯音频三种格式
 */
export default function YouTubeDownloaderPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<ParseResponse | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [activeTab, setActiveTab] = useState<FormatType>('video_with_audio');

  // 设置页面标题
  useEffect(() => {
    setTitle(t('studio.menu.youtubeDownloader'));
  }, [t, setTitle]);

  // 分组后的格式
  const groupedFormats = useMemo(() => {
    if (!videoInfo) return null;
    return getGroupedFormats(videoInfo.formats);
  }, [videoInfo]);

  // 当前 tab 的格式列表
  const currentFormats = useMemo(() => {
    if (!groupedFormats) return [];
    switch (activeTab) {
      case 'video_with_audio':
        return groupedFormats.videoWithAudio;
      case 'video_only':
        return groupedFormats.videoOnly;
      case 'audio_only':
        return groupedFormats.audioOnly;
      default:
        return [];
    }
  }, [groupedFormats, activeTab]);

  // 解析视频
  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError(t('youtubeDownloader.errors.emptyUrl'));
      return;
    }

    if (!isYouTubeUrl(url)) {
      setError(t('youtubeDownloader.errors.invalidUrl'));
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat(null);

    try {
      const result = await parseVideoUrl(url);

      if (!result.success || !result.data) {
        setError(result.error || t('youtubeDownloader.errors.parseFailed'));
        return;
      }

      setVideoInfo(result.data);

      // 获取分组格式
      const grouped = getGroupedFormats(result.data.formats);

      // 自动选择第一个有音频的视频格式
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
      setError(t('youtubeDownloader.errors.parseFailed'));
    } finally {
      setLoading(false);
    }
  }, [url, t]);

  // 切换 tab 时自动选择第一个格式
  useEffect(() => {
    if (currentFormats.length > 0 && !currentFormats.find(f => f.format_id === selectedFormat?.format_id)) {
      setSelectedFormat(currentFormats[0]);
    }
  }, [activeTab, currentFormats, selectedFormat]);

  // 下载
  const handleDownload = useCallback(() => {
    if (!videoInfo || !selectedFormat?.url || downloading) return;

    setDownloading(true);

    const ext = getFormatExtension(selectedFormat);
    const filename = `${videoInfo.title || videoInfo.video_id}.${ext}`;

    // 直接使用 URL 下载
    const a = document.createElement('a');
    a.href = selectedFormat.url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  }, [videoInfo, selectedFormat, downloading]);

  // Tab 配置
  const tabs = useMemo(() => {
    if (!groupedFormats) return [];
    return [
      { id: 'video_with_audio' as FormatType, label: t('youtubeDownloader.tabs.videoWithAudio'), count: groupedFormats.videoWithAudio.length },
      { id: 'video_only' as FormatType, label: t('youtubeDownloader.tabs.videoOnly'), count: groupedFormats.videoOnly.length },
      { id: 'audio_only' as FormatType, label: t('youtubeDownloader.tabs.audioOnly'), count: groupedFormats.audioOnly.length },
    ].filter(tab => tab.count > 0);
  }, [groupedFormats, t]);

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 top-[60px] flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 flex flex-col px-4 pt-4 gap-4 overflow-y-auto pb-24">
          {/* URL 输入框 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('youtubeDownloader.urlLabel')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('youtubeDownloader.urlPlaceholder')}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                  disabled={loading}
                />
                {url && !loading && (
                  <button
                    type="button"
                    onClick={() => { setUrl(''); setVideoInfo(null); setError(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleParse}
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  t('youtubeDownloader.parseButton')
                )}
              </button>
            </div>
          </div>

          {/* 解析中提示 */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-gray-700 font-medium">{t('youtubeDownloader.parsing')}</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <p className="text-sm text-gray-500">{t('youtubeDownloader.doNotClose')}</p>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 视频信息 */}
          {videoInfo && (
            <div className="flex flex-col gap-4">
              {/* 视频信息卡片 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* 缩略图 */}
                  {videoInfo.thumbnail_url && (
                    <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black relative">
                      <Image
                        src={videoInfo.thumbnail_url}
                        alt={videoInfo.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {/* 视频信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{videoInfo.title || t('youtubeDownloader.untitled')}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {videoInfo.author && (
                        <span>{videoInfo.author}</span>
                      )}
                      {videoInfo.duration_seconds && (
                        <span>{formatDuration(videoInfo.duration_seconds)}</span>
                      )}
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
                <h4 className="font-medium text-gray-900 mb-3">{t('youtubeDownloader.selectQuality')}</h4>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {currentFormats.map((format) => (
                    <button
                      key={format.format_id}
                      onClick={() => setSelectedFormat(format)}
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

              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                disabled={!selectedFormat?.url || downloading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('youtubeDownloader.downloading')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('youtubeDownloader.downloadButton')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-4">
                <YouTubeIcon className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('youtubeDownloader.emptyTitle')}</h3>
              <p className="text-gray-500 text-sm max-w-xs">{t('youtubeDownloader.emptyDescription')}</p>
            </div>
          )}
        </div>

        {/* 底部导航栏占位 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-red-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* 标题 */}
          <div className="text-center mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center">
                <YouTubeIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">{t('youtubeDownloader.title')}</h1>
                <p className="text-sm text-gray-500">{t('youtubeDownloader.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* URL 输入框 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('youtubeDownloader.urlLabel')}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                  placeholder={t('youtubeDownloader.urlPlaceholder')}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                {url && !loading && (
                  <button
                    type="button"
                    onClick={() => { setUrl(''); setVideoInfo(null); setError(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleParse}
                disabled={loading || !url.trim()}
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('youtubeDownloader.parsing')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('youtubeDownloader.parseButton')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 解析中提示 */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-gray-700 font-medium text-lg">{t('youtubeDownloader.parsing')}</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <p className="text-gray-500">{t('youtubeDownloader.doNotClose')}</p>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 视频信息 */}
          {videoInfo && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
              {/* 视频信息卡片 */}
              <div className="flex gap-5 items-start">
                {/* 缩略图 */}
                {videoInfo.thumbnail_url && (
                  <div className="w-48 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-black shadow-md relative">
                    <Image
                      src={videoInfo.thumbnail_url}
                      alt={videoInfo.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                {/* 视频信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-2">
                    {videoInfo.title || t('youtubeDownloader.untitled')}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {videoInfo.author && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {videoInfo.author}
                      </span>
                    )}
                    {videoInfo.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(videoInfo.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t border-gray-100 my-5" />

              {/* Tab 切换 */}
              {tabs.length > 1 && (
                <div className="flex gap-2 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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

              {/* 格式选择和下载 */}
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 block mb-3">{t('youtubeDownloader.selectQuality')}</span>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {currentFormats.map((format) => (
                      <button
                        key={format.format_id}
                        onClick={() => setSelectedFormat(format)}
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

                {/* 下载按钮 */}
                <button
                  onClick={handleDownload}
                  disabled={!selectedFormat?.url || downloading}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  {downloading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('youtubeDownloader.downloading')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('youtubeDownloader.downloadButton')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-6">
                <YouTubeIcon className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('youtubeDownloader.emptyTitle')}</h3>
              <p className="text-gray-500 max-w-md">{t('youtubeDownloader.emptyDescription')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}