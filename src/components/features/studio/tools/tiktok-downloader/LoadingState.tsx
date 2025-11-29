/**
 * TikTok Video Loading State Component
 *
 * 视频解析加载状态提示
 */

interface LoadingStateProps {
  parsingText: string;
  doNotCloseText: string;
}

export default function LoadingState({ parsingText, doNotCloseText }: LoadingStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
      <div className="flex flex-col items-center justify-center py-4">
        <div className="flex items-center gap-1 lg:gap-1.5 mb-3">
          <span className="text-gray-700 font-medium lg:text-lg">{parsingText}</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
        <p className="text-sm text-gray-500 lg:text-base">{doNotCloseText}</p>
      </div>
    </div>
  );
}