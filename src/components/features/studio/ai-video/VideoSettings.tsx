'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  type VideoResolution,
  type VideoDuration,
  calculateVideoCost,
} from '@/config/creditsCost';

interface VideoSettingsProps {
  resolution: VideoResolution;
  duration: VideoDuration;
  aspectRatio: '16:9' | '9:16';
  onResolutionChange: (resolution: VideoResolution) => void;
  onDurationChange: (duration: VideoDuration) => void;
  onAspectRatioChange: (aspectRatio: '16:9' | '9:16') => void;
  disabled?: boolean;
}

const RESOLUTIONS: { value: VideoResolution; label: string }[] = [
  { value: '768p', label: '768p' },
  { value: '1080p', label: '1080p' },
];

const DURATIONS: { value: VideoDuration; label: string }[] = [
  { value: 5, label: '5s' },
  { value: 8, label: '8s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
];

const ASPECT_RATIOS: { value: '16:9' | '9:16'; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '🖥️' },
  { value: '9:16', label: '9:16', icon: '📱' },
];

/**
 * Video generation settings panel
 */
export default function VideoSettings({
  resolution,
  duration,
  aspectRatio,
  onResolutionChange,
  onDurationChange,
  onAspectRatioChange,
  disabled = false,
}: VideoSettingsProps) {
  const { t } = useLanguage();

  // Calculate current cost
  const creditsCost = calculateVideoCost(resolution, duration);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
      {/* Resolution */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('video.resolution')}
        </label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.value}
              type="button"
              onClick={() => onResolutionChange(res.value)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${resolution === res.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('video.duration')}
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((dur) => (
            <button
              key={dur.value}
              type="button"
              onClick={() => onDurationChange(dur.value)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${duration === dur.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {dur.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('video.aspectRatio')}
        </label>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              type="button"
              onClick={() => onAspectRatioChange(ratio.value)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                transition-colors duration-200 flex items-center justify-center gap-1
                ${aspectRatio === ratio.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span>{ratio.icon}</span>
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Credits Cost */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t('video.creditsCost')}</span>
          <span className="font-semibold text-purple-600">{creditsCost} {t('common.credits')}</span>
        </div>
      </div>
    </div>
  );
}