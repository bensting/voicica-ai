/**
 * TikTok Video Download Button Component
 *
 * 下载按钮组件
 */

interface DownloadButtonProps {
  downloading: boolean;
  disabled: boolean;
  onClick: () => void;
  downloadButtonText: string;
  downloadingText: string;
  variant?: 'mobile' | 'desktop';
}

export default function DownloadButton({
  downloading,
  disabled,
  onClick,
  downloadButtonText,
  downloadingText,
  variant = 'mobile',
}: DownloadButtonProps) {
  const baseClasses = "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2";

  const variantClasses = variant === 'mobile'
    ? 'w-full py-4'
    : 'px-8 py-3 shadow-lg hover:shadow-xl flex-shrink-0';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses}`}
    >
      {downloading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {downloadingText}
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloadButtonText}
        </>
      )}
    </button>
  );
}