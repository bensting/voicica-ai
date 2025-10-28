import { Eraser, Zap } from 'lucide-react';

interface VoiceModel {
  id: string;
  name: string;
  display_name: Record<string, string>;
  avatar_url: string;
  gender: string;
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxCharacters: number;
  availableCharacters: number;
  disabled?: boolean;
  selectedVoice?: VoiceModel | null;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

/**
 * 文本输入组件
 *
 * 显示文本输入框和字符计数
 */
export default function TextInput({
  value,
  onChange,
  maxCharacters,
  availableCharacters,
  disabled = false,
  selectedVoice = null,
  speed = 1.0,
  onSpeedChange,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
        {/* Left: Clear Button */}
        <button
          onClick={() => onChange('')}
          disabled={!value || disabled}
          title="清除所有内容"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser className="w-5 h-5" />
        </button>

        {/* Center: Voice Avatar */}
        <div className="flex items-center gap-2">
          {selectedVoice ? (
            <>
              <img
                src={selectedVoice.avatar_url}
                alt={selectedVoice.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedVoice.display_name?.en || selectedVoice.name}</p>
                <p className="text-xs text-gray-500">{selectedVoice.gender}</p>
              </div>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: Speed Control */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">速度</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
            disabled={disabled}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
      </div>

      {/* 文本输入框 */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder=""
          className="w-full h-48 md:h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-base disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        />

        {/* 字符计数 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={`text-sm font-medium ${
            availableCharacters < 20 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {value.length}/{maxCharacters}
          </span>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="flex items-center justify-between text-sm">
        <button
          onClick={() => onChange('')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:opacity-50"
          disabled={!value || disabled}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          No content? Try this:
        </button>

        <p className="text-gray-600">
          Limit {maxCharacters} characters per generation.{' '}
          <span className="font-medium">
            Available: {availableCharacters} characters.
          </span>
        </p>
      </div>
    </div>
  );
}