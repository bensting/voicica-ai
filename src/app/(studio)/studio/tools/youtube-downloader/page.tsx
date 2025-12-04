'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import YouTubeIcon from '@/components/icons/YouTubeIcon';
import {
  parseVideoUrl,
  type ParseResponse,
  type VideoFormat,
} from '@/actions/video-downloader';
import { getVideoParseErrorMessage } from '@/lib/services/video-downloader-utils';
import {
  isYouTubeUrl,
  getGroupedFormats,
  getFormatExtension,
  type FormatType,
} from '@/lib/services/youtube-downloader';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';

// 组件导入
import VideoUrlInput, { ParseButton } from '@/components/features/studio/tools/youtube-downloader/VideoUrlInput';
import LoadingState from '@/components/features/studio/tools/youtube-downloader/LoadingState';
import ErrorMessage from '@/components/features/studio/tools/youtube-downloader/ErrorMessage';
import VideoInfoCard from '@/components/features/studio/tools/youtube-downloader/VideoInfoCard';
import FormatSelector from '@/components/features/studio/tools/youtube-downloader/FormatSelector';
import DownloadButton from '@/components/features/studio/tools/youtube-downloader/DownloadButton';
import CreditInfoSection from '@/components/features/studio/tools/common/CreditInfoSection';
import ToolEmptyState from '@/components/features/studio/tools/common/ToolEmptyState';

/**
 * YouTube Video Downloader Page
 *
 * 解析 YouTube 视频并提供下载功能
 * 支持视频（有音频）、纯视频、纯音频三种格式
 */
export default function YouTubeDownloaderPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { refreshCredits } = useCredits();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<ParseResponse | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [activeTab, setActiveTab] = useState<FormatType>('video_with_audio');

  // 获取 YouTube 下载器的积分成本
  const creditCost = useMemo(() => {
    return calculateProductCreditsCost(ProductType.YOUTUBE_DOWNLOADER);
  }, []);

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

  // Tab 配置
  const tabs = useMemo(() => {
    if (!groupedFormats) return [];
    return [
      { id: 'video_with_audio' as FormatType, label: t('youtubeDownloader.tabs.videoWithAudio'), count: groupedFormats.videoWithAudio.length },
      { id: 'video_only' as FormatType, label: t('youtubeDownloader.tabs.videoOnly'), count: groupedFormats.videoOnly.length },
      { id: 'audio_only' as FormatType, label: t('youtubeDownloader.tabs.audioOnly'), count: groupedFormats.audioOnly.length },
    ].filter(tab => tab.count > 0);
  }, [groupedFormats, t]);

  // 清除输入
  const handleClear = useCallback(() => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
  }, []);

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
        // 使用错误码获取国际化错误信息
        const errorCode = result.errorCode || 'UNKNOWN_ERROR';
        setError(getVideoParseErrorMessage(errorCode, result.errorData, t, 'youtubeDownloader'));
        return;
      }

      setVideoInfo(result.data);

      // 解析成功，刷新用户积分
      await refreshCredits();

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
      setError(t('youtubeDownloader.errors.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [url, t, refreshCredits]);

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

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 top-[60px] flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 flex flex-col px-4 pt-4 gap-4 overflow-y-auto pb-24">
          {/* URL 输入框卡片 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('youtubeDownloader.urlLabel')}
            </label>
            <VideoUrlInput
              url={url}
              loading={loading}
              onUrlChange={setUrl}
              onClear={handleClear}
              onParse={handleParse}
              placeholder={t('youtubeDownloader.urlPlaceholder')}
            />

            {/* 积分信息 */}
            <div className="my-3">
              <CreditInfoSection creditCost={creditCost} actionName="解析" variant="mobile" />
            </div>

            {/* 解析按钮 */}
            <button
              onClick={handleParse}
              disabled={loading || !url.trim()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

          {/* 解析中提示 */}
          {loading && (
            <LoadingState
              parsingText={t('youtubeDownloader.parsing')}
              doNotCloseText={t('youtubeDownloader.doNotClose')}
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
                untitledText={t('youtubeDownloader.untitled')}
                variant="mobile"
              />

              {/* 格式选择 */}
              <FormatSelector
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                currentFormats={currentFormats}
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
                selectQualityText={t('youtubeDownloader.selectQuality')}
                variant="mobile"
              />

              {/* 下载按钮 */}
              <DownloadButton
                downloading={downloading}
                disabled={!selectedFormat?.url || downloading}
                onClick={handleDownload}
                downloadButtonText={t('youtubeDownloader.downloadButton')}
                downloadingText={t('youtubeDownloader.downloading')}
                variant="mobile"
              />
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <ToolEmptyState
              icon={<YouTubeIcon className="w-6 h-6" />}
              title={t('youtubeDownloader.emptyTitle')}
              description={t('youtubeDownloader.emptyDescription')}
              colorFrom="from-red-100"
              colorTo="to-red-50"
              iconColor="text-red-600"
              bgColor="bg-red-50/60"
              variant="mobile"
            />
          )}
        </div>

        {/* 底部导航栏占位 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block bg-gradient-to-b from-white to-red-50 lg:h-[calc(100vh-60px)] overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex gap-3 mb-3">
              <VideoUrlInput
                url={url}
                loading={loading}
                onUrlChange={setUrl}
                onClear={handleClear}
                onParse={handleParse}
                placeholder={t('youtubeDownloader.urlPlaceholder')}
              />
              <ParseButton
                loading={loading}
                disabled={loading || !url.trim()}
                onClick={handleParse}
                parseButtonText={t('youtubeDownloader.parseButton')}
                parsingText={t('youtubeDownloader.parsing')}
              />
            </div>

            {/* 积分信息 */}
            <CreditInfoSection creditCost={creditCost} actionName="解析" variant="desktop" />
          </div>

          {/* 解析中提示 */}
          {loading && (
            <div className="mb-6">
              <LoadingState
                parsingText={t('youtubeDownloader.parsing')}
                doNotCloseText={t('youtubeDownloader.doNotClose')}
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
                untitledText={t('youtubeDownloader.untitled')}
                variant="desktop"
              />

              {/* 分隔线 */}
              <div className="border-t border-gray-100 my-5" />

              {/* 格式选择和下载 */}
              <div className="flex flex-col gap-4">
                <FormatSelector
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  currentFormats={currentFormats}
                  selectedFormat={selectedFormat}
                  onSelectFormat={setSelectedFormat}
                  selectQualityText={t('youtubeDownloader.selectQuality')}
                  variant="desktop"
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1" />
                  {/* 下载按钮 */}
                  <DownloadButton
                    downloading={downloading}
                    disabled={!selectedFormat?.url || downloading}
                    onClick={handleDownload}
                    downloadButtonText={t('youtubeDownloader.downloadButton')}
                    downloadingText={t('youtubeDownloader.downloading')}
                    variant="desktop"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !videoInfo && !error && (
            <ToolEmptyState
              icon={<YouTubeIcon className="w-7 h-7" />}
              title={t('youtubeDownloader.emptyTitle')}
              description={t('youtubeDownloader.emptyDescription')}
              colorFrom="from-red-100"
              colorTo="to-red-50"
              iconColor="text-red-600"
              variant="desktop"
            />
          )}
        </div>
      </div>
    </>
  );
}