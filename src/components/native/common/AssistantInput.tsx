'use client';

import { ReactNode } from 'react';

const AssistantIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#6366f1" />
    <circle cx="8" cy="10" r="1.5" fill="white" />
    <circle cx="16" cy="10" r="1.5" fill="white" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4H8z" fill="white" />
  </svg>
);

interface AssistantInputProps {
  /** 标签文字 */
  label: string;
  /** 是否显示 (optional) 标签 */
  optional?: boolean;
  /** 输入框占位符 */
  placeholder?: string;
  /** 输入值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 最大字符数 */
  maxLength?: number;
  /** 是否多行输入 */
  multiline?: boolean;
  /** 多行输入时的行数 */
  rows?: number;
  /** AI 助手按钮文字 */
  assistantButtonText?: string;
  /** 点击 AI 助手按钮回调 */
  onAssistantClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 右侧额外操作按钮 */
  rightActions?: ReactNode;
  /** 外层容器自定义类名 */
  className?: string;
  /** 输入框容器自定义类名 */
  containerClassName?: string;
  /** 输入框自定义类名 */
  inputClassName?: string;
}

/**
 * 带 AI 助手按钮的输入组件
 *
 * @example
 * ```tsx
 * <AssistantInput
 *   label="Style"
 *   optional
 *   placeholder="pop, rock, jazz..."
 *   value={style}
 *   onChange={setStyle}
 *   maxLength={200}
 *   assistantButtonText="Generate Style"
 *   onAssistantClick={() => setIsStyleAssistantOpen(true)}
 * />
 * ```
 */
export default function AssistantInput({
  label,
  optional = false,
  placeholder,
  value,
  onChange,
  maxLength,
  multiline = false,
  rows = 4,
  assistantButtonText = 'Generate',
  onAssistantClick,
  disabled = false,
  rightActions,
  className = '',
  containerClassName = '',
  inputClassName = '',
}: AssistantInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{label}</span>
            {optional && <span className="text-gray-500 text-xs">(optional)</span>}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className={`bg-gray-800/60 rounded-2xl overflow-hidden ${containerClassName}`}>
        {multiline ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full bg-transparent text-white placeholder-gray-500 p-4 resize-none focus:outline-none text-sm ${inputClassName}`}
            disabled={disabled}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full bg-transparent text-white placeholder-gray-500 p-4 focus:outline-none text-sm ${inputClassName}`}
            disabled={disabled}
          />
        )}

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 pb-3">
          {onAssistantClick ? (
            <button
              onClick={onAssistantClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 rounded-full text-gray-300 text-xs hover:bg-gray-600/50 transition-colors disabled:opacity-50"
              disabled={disabled}
            >
              <AssistantIcon />
              <span>{assistantButtonText}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {maxLength && (
              <span className="text-gray-500 text-xs">{value.length}/{maxLength}</span>
            )}
            {rightActions}
          </div>
        </div>
      </div>
    </div>
  );
}
