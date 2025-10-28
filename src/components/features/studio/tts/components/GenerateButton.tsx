import { Loader2, Play } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

/**
 * 生成按钮组件
 *
 * 显示生成按钮和加载状态
 */
export default function GenerateButton({
  onClick,
  disabled,
  isGenerating,
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Play className="w-5 h-5" />
          GENERATE
        </>
      )}
    </button>
  );
}