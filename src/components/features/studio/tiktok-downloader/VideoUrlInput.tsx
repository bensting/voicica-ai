/**
 * TikTok Video URL Input Component
 *
 * URL 输入框和解析按钮组件
 */

interface VideoUrlInputProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onClear: () => void;
  onParse: () => void;
  placeholder: string;
}

export default function VideoUrlInput({
  url,
  loading,
  onUrlChange,
  onClear,
  onParse,
  placeholder,
}: VideoUrlInputProps) {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && url.trim() && onParse()}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        disabled={loading}
      />
      {url && !loading && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Parse Button Component - 可独立使用的解析按钮
 */
interface ParseButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  parseButtonText: string;
  parsingText: string;
}

export function ParseButton({
  loading,
  disabled,
  onClick,
  parseButtonText,
  parsingText,
}: ParseButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-8 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {parsingText}
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {parseButtonText}
        </>
      )}
    </button>
  );
}