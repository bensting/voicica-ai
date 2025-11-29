'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import TikTokIcon from '@/components/icons/TikTokIcon';
import {
  parseVideoUrl,
  type ParseResponse,
  type VideoFormat,
} from '@/actions/video-downloader';
import {
  getProxyDownloadUrl,
  isTikTokUrl,
} from '@/lib/services/tiktok-downloader';

// 组件导入
import VideoUrlInput, { ParseButton } from '@/components/features/studio/tiktok-downloader/VideoUrlInput';
import LoadingState from '@/components/features/studio/tiktok-downloader/LoadingState';
import ErrorMessage from '@/components/features/studio/tiktok-downloader/ErrorMessage';
import VideoInfoCard from '@/components/features/studio/tiktok-downloader/VideoInfoCard';
import FormatSelector from '@/components/features/studio/tiktok-downloader/FormatSelector';
import DownloadButton from '@/components/features/studio/tiktok-downloader/DownloadButton';
import EmptyState from '@/components/features/studio/tiktok-downloader/EmptyState';

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

  // 清除输入
  const handleClear = useCallback(() => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
  }, []);

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
      const result = await parseVideoUrl(url);

      if (!result.success || !result.data) {
        setError(result.error || t('tiktokDownloader.errors.parseFailed'));
        return;
      }

      setVideoInfo(result.data);

      // 自动选择最佳格式（优先选择 play_direct）
      const bestFormat = result.data.formats.find(f => f.format_id === 'play_direct') || result.data.formats[0];
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
              <VideoUrlInput
                url={url}
                loading={loading}
                onUrlChange={setUrl}
                onClear={handleClear}
                onParse={handleParse}
                placeholder={t('tiktokDownloader.urlPlaceholder')}
              />
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
            <LoadingState
              parsingText={t('tiktokDownloader.parsing')}
              doNotCloseText={t('tiktokDownloader.doNotClose')}
            />
          )}

          {/* 错误提示 */}
          {error && <ErrorMessage message={error} />}

          {/* 视频信息 */}
          {videoInfo && (
            <div className="flex flex-col gap-4">
              {/* 视频信息卡片 */}
              <VideoInfoCard
                videoInfo={videoInfo}
                untitledText={t('tiktokDownloader.untitled')}
                variant="mobile"
              />

              {/* 格式选择 */}
              <FormatSelector
                formats={videoInfo.formats}
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
                selectQualityText={t('tiktokDownloader.selectQuality')}
                variant="mobile"
              />

              {/* 下载按钮 */}
              <DownloadButton
                downloading={downloading}
                disabled={!selectedFormat?.url || downloading}
                onClick={handleDownload}
                downloadButtonText={t('tiktokDownloader.downloadButton')}
                downloadingText={t('tiktokDownloader.downloading')}
                variant="mobile"
              />
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <EmptyState
              emptyTitle={t('tiktokDownloader.emptyTitle')}
              emptyDescription={t('tiktokDownloader.emptyDescription')}
              variant="mobile"
            />
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
              <VideoUrlInput
                url={url}
                loading={loading}
                onUrlChange={setUrl}
                onClear={handleClear}
                onParse={handleParse}
                placeholder={t('tiktokDownloader.urlPlaceholder')}
              />
              <ParseButton
                loading={loading}
                disabled={loading || !url.trim()}
                onClick={handleParse}
                parseButtonText={t('tiktokDownloader.parseButton')}
                parsingText={t('tiktokDownloader.parsing')}
              />
            </div>
          </div>

          {/* 解析中提示 */}
          {loading && (
            <div className="mb-6">
              <LoadingState
                parsingText={t('tiktokDownloader.parsing')}
                doNotCloseText={t('tiktokDownloader.doNotClose')}
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* 视频信息 */}
          {videoInfo && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
              {/* 视频信息卡片 */}
              <VideoInfoCard
                videoInfo={videoInfo}
                untitledText={t('tiktokDownloader.untitled')}
                variant="desktop"
              />

              {/* 分隔线 */}
              <div className="border-t border-gray-100 my-5" />

              {/* 格式选择和下载 */}
              <div className="flex items-center justify-between gap-4">
                <FormatSelector
                  formats={videoInfo.formats}
                  selectedFormat={selectedFormat}
                  onSelectFormat={setSelectedFormat}
                  selectQualityText={t('tiktokDownloader.selectQuality')}
                  variant="desktop"
                />

                {/* 下载按钮 */}
                <DownloadButton
                  downloading={downloading}
                  disabled={!selectedFormat?.url || downloading}
                  onClick={handleDownload}
                  downloadButtonText={t('tiktokDownloader.downloadButton')}
                  downloadingText={t('tiktokDownloader.downloading')}
                  variant="desktop"
                />
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <EmptyState
              emptyTitle={t('tiktokDownloader.emptyTitle')}
              emptyDescription={t('tiktokDownloader.emptyDescription')}
              variant="desktop"
            />
          )}
        </div>
      </div>
    </>
  );
}