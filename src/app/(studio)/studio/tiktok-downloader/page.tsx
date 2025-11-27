'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import TikTokIcon from '@/components/icons/TikTokIcon';
import {
  parseVideo,
  getProxyDownloadUrl,
  isTikTokUrl,
  formatFileSize,
  formatDuration,
  type ParseResponse,
  type VideoFormat,
} from '@/lib/services/tiktok-downloader';

/**
 * TikTok Video Downloader Page
 *
 * 解析 TikTok 视频并提供下载功能
 */
export default function TikTokDownloaderPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<ParseResponse | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);

  // 设置页面标题
  useEffect(() => {
    setTitle(t('studio.menu.tiktokDownloader'));
  }, [t, setTitle]);

  // 解析视频
  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError(t('tiktokDownloader.errors.emptyUrl'));
      return;
    }

    if (!isTikTokUrl(url)) {
      setError(t('tiktokDownloader.errors.invalidUrl'));
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat(null);

    try {
      const result = await parseVideo(url);
      setVideoInfo(result);

      // 自动选择最佳格式（优先选择 play_direct）
      const bestFormat = result.formats.find(f => f.format_id === 'play_direct') || result.formats[0];
      setSelectedFormat(bestFormat);
    } catch {
      setError(t('tiktokDownloader.errors.parseFailed'));
    } finally {
      setLoading(false);
    }
  }, [url, t]);

  // 下载视频
  const handleDownload = useCallback(() => {
    if (!videoInfo || !selectedFormat?.url || downloading) return;

    setDownloading(true);

    const filename = `${videoInfo.title || videoInfo.video_id}.mp4`;
    const downloadUrl = getProxyDownloadUrl(videoInfo.video_id, selectedFormat.url, filename);

    // 创建隐藏的 a 标签并触发下载
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 延迟重置下载状态，给用户反馈
    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  }, [videoInfo, selectedFormat, downloading]);

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 top-[60px] flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 flex flex-col px-4 pt-4 gap-4 overflow-y-auto pb-24">
          {/* URL 输入框 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('tiktokDownloader.urlLabel')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('tiktokDownloader.urlPlaceholder')}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
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
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  t('tiktokDownloader.parseButton')
                )}
              </button>
            </div>
          </div>

          {/* 解析中提示 */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-gray-700 font-medium">{t('tiktokDownloader.parsing')}</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <p className="text-sm text-gray-500">{t('tiktokDownloader.doNotClose')}</p>
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
                    <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                      <img
                        src={videoInfo.thumbnail_url}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* 视频信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2">{videoInfo.title || t('tiktokDownloader.untitled')}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      {videoInfo.author && (
                        <span>@{videoInfo.author}</span>
                      )}
                      {videoInfo.duration_seconds && (
                        <span>{formatDuration(videoInfo.duration_seconds)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 格式选择 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">{t('tiktokDownloader.selectQuality')}</h4>
                <div className="flex flex-col gap-2">
                  {videoInfo.formats.map((format) => (
                    <button
                      key={format.format_id}
                      onClick={() => setSelectedFormat(format)}
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

              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                disabled={!selectedFormat?.url || downloading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('tiktokDownloader.downloading')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('tiktokDownloader.downloadButton')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                <TikTokIcon className="w-10 h-10 text-gray-900" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('tiktokDownloader.emptyTitle')}</h3>
              <p className="text-gray-500 text-sm max-w-xs">{t('tiktokDownloader.emptyDescription')}</p>
            </div>
          )}
        </div>

        {/* 底部导航栏占位 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* 标题 */}
          <div className="text-center mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <TikTokIcon className="w-5 h-5 text-gray-900" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">{t('tiktokDownloader.title')}</h1>
                <p className="text-sm text-gray-500">{t('tiktokDownloader.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* URL 输入框 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tiktokDownloader.urlLabel')}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                  placeholder={t('tiktokDownloader.urlPlaceholder')}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('tiktokDownloader.parsing')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('tiktokDownloader.parseButton')}
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
                  <span className="text-gray-700 font-medium text-lg">{t('tiktokDownloader.parsing')}</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <p className="text-gray-500">{t('tiktokDownloader.doNotClose')}</p>
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
                  <div className="w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-black shadow-md">
                    <img
                      src={videoInfo.thumbnail_url}
                      alt={videoInfo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* 视频信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-2">
                    {videoInfo.title || t('tiktokDownloader.untitled')}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {videoInfo.author && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        @{videoInfo.author}
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

              {/* 格式选择和下载 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">{t('tiktokDownloader.selectQuality')}</span>
                  <div className="flex flex-wrap gap-2">
                    {videoInfo.formats.map((format) => (
                      <button
                        key={format.format_id}
                        onClick={() => setSelectedFormat(format)}
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

                {/* 下载按钮 */}
                <button
                  onClick={handleDownload}
                  disabled={!selectedFormat?.url || downloading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  {downloading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('tiktokDownloader.downloading')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('tiktokDownloader.downloadButton')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                <TikTokIcon className="w-12 h-12 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('tiktokDownloader.emptyTitle')}</h3>
              <p className="text-gray-500 max-w-md">{t('tiktokDownloader.emptyDescription')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}