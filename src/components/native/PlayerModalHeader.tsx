'use client';

import { useState } from 'react';
import ReportModal from './common/ReportModal';

interface PlayerModalHeaderProps {
  /** 关闭回调 */
  onClose: () => void;
  /** 分享回调 */
  onShare?: () => void;
  /** 是否正在分享 */
  isSharing?: boolean;
  /** 禁用分享按钮 */
  shareDisabled?: boolean;
  /** 内容类型（用于举报） */
  contentType: 'music' | 'video' | 'tts';
  /** 内容 ID（用于举报） */
  contentId?: string;
}

/**
 * 公开内容播放器的公共头部组件
 * 用于 MusicPlayerModal 和 VideoPlayerModal（Explore 页面）
 * 包含返回、分享、Report 功能
 */
export default function PlayerModalHeader({
  onClose,
  onShare,
  isSharing = false,
  shareDisabled = false,
  contentType,
  contentId,
}: PlayerModalHeaderProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* 返回按钮 */}
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* 右侧按钮组 */}
        <div className="flex items-center gap-2">
          {/* 分享按钮 */}
          {onShare && (
            <button
              onClick={onShare}
              disabled={isSharing || shareDisabled}
              className="w-10 h-10 flex items-center justify-center disabled:opacity-50"
            >
              {isSharing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              )}
            </button>
          )}

          {/* Report 按钮 */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-10 h-10 flex items-center justify-center"
            title="Report"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType={contentType}
        contentId={contentId}
      />
    </>
  );
}
