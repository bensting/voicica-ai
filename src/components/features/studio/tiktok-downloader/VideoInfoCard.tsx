/**
 * TikTok Video Info Card Component
 *
 * 视频信息卡片（缩略图、标题、作者、时长）
 */

import Image from 'next/image';
import type { ParseResponse } from '@/actions/video-downloader';
import { formatDuration } from '@/lib/services/tiktok-downloader';

interface VideoInfoCardProps {
  videoInfo: ParseResponse;
  untitledText: string;
  variant?: 'mobile' | 'desktop';
}

export default function VideoInfoCard({ videoInfo, untitledText, variant = 'mobile' }: VideoInfoCardProps) {
  // TikTok 缩略图可以直接访问，不需要代理
  const thumbnailUrl = videoInfo.thumbnail_url;
  if (variant === 'mobile') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex gap-4 p-4">
          {/* 缩略图 */}
          {thumbnailUrl && (
            <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-black relative">
              <Image
                src={thumbnailUrl}
                alt={videoInfo.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          {/* 视频信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {videoInfo.title || untitledText}
            </h3>
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
    );
  }

  return (
    <div className="flex gap-5 items-start">
      {/* 缩略图 */}
      {thumbnailUrl && (
        <div className="w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-black shadow-md relative">
          <Image
            src={thumbnailUrl}
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
          {videoInfo.title || untitledText}
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
  );
}