'use client';

import { ModelOptionsConfig } from '@/config/native/videoModels';

interface AdvancedOptionsProps {
  config?: ModelOptionsConfig;
  fixedLens: boolean;
  generateAudio: boolean;
  onFixedLensChange: (value: boolean) => void;
  onGenerateAudioChange: (value: boolean) => void;
}

/**
 * Toggle 开关组件
 */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/**
 * Advanced Options 组件
 * 显示模型特有的高级选项（如 fixed_lens、generate_audio）
 */
export default function AdvancedOptions({
  config,
  fixedLens,
  generateAudio,
  onFixedLensChange,
  onGenerateAudioChange,
}: AdvancedOptionsProps) {
  // 如果没有可显示的选项，不渲染
  if (!config || (!config.fixedLens && !config.generateAudio)) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Fixed Lens */}
      {config.fixedLens && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">fixed_lens</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Enable to keep the camera view static and stable. Disable for dynamic camera movement.
            </p>
          </div>
          <Toggle checked={fixedLens} onChange={onFixedLensChange} />
        </div>
      )}

      {/* Generate Audio */}
      {config.generateAudio && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">generate_audio</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Enable to create sound effects for the video (Additional cost applies).
            </p>
          </div>
          <Toggle checked={generateAudio} onChange={onGenerateAudioChange} />
        </div>
      )}
    </div>
  );
}
