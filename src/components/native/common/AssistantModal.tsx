'use client';

import GradientButton from './GradientButton';

const AssistantIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#6366f1" />
    <circle cx="8" cy="10" r="1.5" fill="white" />
    <circle cx="16" cy="10" r="1.5" fill="white" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4H8z" fill="white" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

interface AssistantModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 弹窗标题 */
  title: string;
  /** 描述文字 */
  description: string;
  /** 输入框占位符 */
  placeholder?: string;
  /** 输入值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 最大字符数 */
  maxLength?: number;
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** 生成按钮点击回调 */
  onGenerate: () => void;
  /** 生成按钮文字 */
  generateButtonText?: string;
  /** 生成中按钮文字 */
  generatingButtonText?: string;
}

/**
 * AI 助手生成弹窗
 *
 * @example
 * ```tsx
 * <AssistantModal
 *   isOpen={isStyleAssistantOpen}
 *   onClose={() => setIsStyleAssistantOpen(false)}
 *   title="Style Assistant"
 *   description="Describe your song's mood, theme, or reference artists."
 *   placeholder="e.g., An energetic dance track..."
 *   value={stylePrompt}
 *   onChange={setStylePrompt}
 *   maxLength={500}
 *   isGenerating={isGeneratingStyle}
 *   onGenerate={handleGenerateStyle}
 *   generateButtonText="Generate Style"
 * />
 * ```
 */
export default function AssistantModal({
  isOpen,
  onClose,
  title,
  description,
  placeholder,
  value,
  onChange,
  maxLength = 500,
  isGenerating = false,
  onGenerate,
  generateButtonText = 'Generate',
  generatingButtonText = 'Generating...',
}: AssistantModalProps) {
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div
        className="w-full max-w-lg bg-[#1a1a2e] rounded-t-3xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white"
            disabled={isGenerating}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-4">
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full h-24 bg-gray-800/60 text-white placeholder-gray-500 p-4 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            disabled={isGenerating}
          />
          <div className="flex justify-end mt-2">
            <span className="text-gray-500 text-xs">{value.length}/{maxLength}</span>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-4 pb-4">
          <GradientButton
            onClick={onGenerate}
            disabled={!value.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{generatingButtonText}</span>
              </>
            ) : (
              <>
                <AssistantIcon />
                <span>{generateButtonText}</span>
              </>
            )}
          </GradientButton>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
