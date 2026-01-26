'use client';

import { Pencil, Download } from 'lucide-react';
import GradientButton from '@/components/native/common/GradientButton';

interface DetailActionBarProps {
  /** 是否显示 Recreate 按钮 */
  showRecreate?: boolean;
  /** Recreate 回调 */
  onRecreate?: () => void;
  /** 是否显示 Download 按钮 */
  showDownload?: boolean;
  /** Download 回调 */
  onDownload?: () => void;
  /** 是否禁用 Download */
  downloadDisabled?: boolean;
  /** 是否正在下载 */
  downloading?: boolean;
  /** Download 按钮文字 */
  downloadText?: string;
}

/**
 * 统一的详情页底部操作栏
 * 用于 Video、Music、Voice 等详情页
 */
export default function DetailActionBar({
  showRecreate = true,
  onRecreate,
  showDownload = true,
  onDownload,
  downloadDisabled = false,
  downloading = false,
  downloadText = 'Download',
}: DetailActionBarProps) {
  return (
    <div className="flex gap-2.5">
      {showRecreate && onRecreate && (
        <button
          onClick={onRecreate}
          className="flex-[1] flex items-center justify-center gap-1.5 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white text-sm font-medium hover:bg-gray-700 transition-all"
        >
          <Pencil size={14} />
          Recreate
        </button>
      )}
      {showDownload && onDownload && (
        <GradientButton
          icon={downloading ? undefined : Download}
          iconPosition="left"
          iconSize={15}
          onClick={onDownload}
          disabled={downloadDisabled || downloading}
          className={`${showRecreate ? 'flex-[2]' : 'flex-1'} !w-auto`}
        >
          {downloading ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Downloading...</span>
            </div>
          ) : (
            downloadText
          )}
        </GradientButton>
      )}
    </div>
  );
}
