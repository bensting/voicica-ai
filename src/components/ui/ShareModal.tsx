'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ShareType = 'tts' | 'clone' | 'edit';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  text: string;
  type?: ShareType; // 分享类型，默认 tts
}

/**
 * 分享弹窗组件
 * 显示分享链接并提供复制功能
 */
export default function ShareModal({ isOpen, onClose, shareId, text, type = 'tts' }: ShareModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // 生成分享链接
  useEffect(() => {
    if (typeof window !== 'undefined' && shareId) {
      setShareUrl(`${window.location.origin}/share/${type}/${shareId}`);
    }
  }, [shareId, type]);

  // 复制链接
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 使用系统分享（移动端）
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('share.title'),
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          url: shareUrl,
        });
      } catch (err) {
        // 用户取消分享不算错误
        if ((err as Error).name !== 'AbortError') {
          console.error('分享失败:', err);
        }
      }
    }
  };

  // 按 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('share.modalTitle')}
            </h3>
          </div>

          {/* 文本预览 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 line-clamp-3">
              {text}
            </p>
          </div>

          {/* 分享链接 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('share.linkLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-600"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('share.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('share.copy')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 系统分享按钮（仅移动端显示） */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              {t('share.moreOptions')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}