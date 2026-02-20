'use client';

import { useEffect } from 'react';
import DetailActionBar from './DetailActionBar';
import { useBottomNav } from '@/contexts/BottomNavContext';

interface ImageToolResult {
  taskId: string;
  toolType: 'bg-remove' | 'upscale';
  originalImageUrl: string;
  resultImageUrl: string;
  creditsUsed: number;
}

interface ImageToolDetailModalProps {
  result: ImageToolResult;
  onClose: () => void;
  onProcessNew: () => void;
}

/**
 * Image Tool Detail Modal
 * 成功处理后显示 Before/After 对比 + 下载按钮
 */
export default function ImageToolDetailModal({
  result,
  onClose,
  onProcessNew,
}: ImageToolDetailModalProps) {
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  const toolLabel = result.toolType === 'bg-remove' ? 'BG Remove' : 'HD Upscale';
  const ext = result.resultImageUrl.includes('.jpg') || result.resultImageUrl.includes('.jpeg') ? 'jpg' : 'png';

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-white font-semibold">{toolLabel}</h2>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Before / After */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Before */}
          <div>
            <p className="text-gray-400 text-xs mb-1.5 text-center">Before</p>
            <div className="aspect-square bg-gray-800/60 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.originalImageUrl}
                alt="Before"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          {/* After */}
          <div>
            <p className="text-gray-400 text-xs mb-1.5 text-center">After</p>
            <div
              className="aspect-square rounded-xl overflow-hidden"
              style={result.toolType === 'bg-remove' ? {
                backgroundImage: 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%)',
                backgroundSize: '20px 20px',
              } : { backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.resultImageUrl}
                alt="After"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-800 rounded">{toolLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits Used</span>
            <span className="text-white">{result.creditsUsed}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#0a0a1a]/95 backdrop-blur-sm border-t border-gray-800"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <DetailActionBar
          onRecreate={onProcessNew}
          fileUrl={result.resultImageUrl}
          fileName={`voicica_${result.toolType}_${result.taskId}.${ext}`}
          fileType="image"
        />
      </div>
    </div>
  );
}
