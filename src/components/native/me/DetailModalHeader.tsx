'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Trash2, ExternalLink } from 'lucide-react';
import { Browser } from '@capacitor/browser';

interface DetailModalHeaderProps {
  /** 关闭回调 */
  onClose: () => void;
  /** 分享回调 */
  onShare?: () => void;
  /** 删除回调 */
  onDelete?: () => void;
  /** 是否正在分享 */
  isSharing?: boolean;
  /** 禁用分享按钮 */
  shareDisabled?: boolean;
  /** 在浏览器打开的 URL */
  browserUrl?: string;
}

/**
 * Detail Modal 公共头部组件
 * 用于 Music、Video、Image DetailModal
 */
export default function DetailModalHeader({
  onClose,
  onShare,
  onDelete,
  isSharing = false,
  shareDisabled = false,
  browserUrl,
}: DetailModalHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // 在浏览器打开
  const handleOpenInBrowser = async () => {
    if (!browserUrl) return;
    setShowMenu(false);
    try {
      await Browser.open({ url: browserUrl });
    } catch (error) {
      console.error('Failed to open browser:', error);
      // 回退到 window.open
      window.open(browserUrl, '_blank');
    }
  };

  // 删除
  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.();
  };

  return (
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
              <Share2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        {/* 更多菜单 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-xl shadow-lg overflow-hidden z-10">
              {/* 在浏览器打开 */}
              {browserUrl && (
                <button
                  onClick={handleOpenInBrowser}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink size={18} />
                  <span>Open in Browser</span>
                </button>
              )}

              {/* 删除 */}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
