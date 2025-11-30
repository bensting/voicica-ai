'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudioSettings } from '@/contexts/AudioSettingsContext';
import { AUDIO_SETTINGS_RANGE } from '@/types/audioSettings';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 桌面端音频参数设置面板
 *
 * 功能：
 * - 可展开/折叠
 * - 显示语速、音量、音调三个滑块
 * - 实时保存设置到 Context
 */

export default function AudioSettingsPanel() {
  const { t } = useLanguage();
  const { settings, updateSettings } = useAudioSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  const getPitchLabel = (value: number) => {
    if (value <= 10) return t('tts.audioSettings.pitch.deep');
    if (value <= 35) return t('tts.audioSettings.pitch.dull');
    if (value <= 65) return t('tts.audioSettings.pitch.consistent');
    if (value <= 90) return t('tts.audioSettings.pitch.bright');
    return t('tts.audioSettings.pitch.crisp');
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex flex-col items-center justify-center p-3.5 hover:bg-gray-50 transition-colors rounded-2xl gap-1.5 relative"
      >
        {/* Expand/Collapse indicator - right side vertically centered */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>

        <Settings className="w-6 h-6 text-gray-700" />
        <span className="text-xs font-medium text-gray-700">
          {t('tts.audioSettings.title')}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6 border-t border-gray-200 pt-4">
          {/* Speed */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {t('tts.audioSettings.speed.title')}
              </label>
              <span className="text-sm font-semibold text-purple-600">
                {settings.speed}x
              </span>
            </div>
            <input
              type="range"
              min={AUDIO_SETTINGS_RANGE.speed.min}
              max={AUDIO_SETTINGS_RANGE.speed.max}
              step={AUDIO_SETTINGS_RANGE.speed.step}
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{AUDIO_SETTINGS_RANGE.speed.min}x</span>
              <span>{AUDIO_SETTINGS_RANGE.speed.max}x</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {t('tts.audioSettings.volume.title')}
              </label>
              <span className="text-sm font-semibold text-purple-600">
                {settings.volume}%
              </span>
            </div>
            <input
              type="range"
              min={AUDIO_SETTINGS_RANGE.volume.min}
              max={AUDIO_SETTINGS_RANGE.volume.max}
              step={AUDIO_SETTINGS_RANGE.volume.step}
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{AUDIO_SETTINGS_RANGE.volume.min}%</span>
              <span>{AUDIO_SETTINGS_RANGE.volume.max}%</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {t('tts.audioSettings.pitch.title')}
              </label>
              <span className="text-sm font-semibold text-purple-600">
                {settings.pitch} ({getPitchLabel(settings.pitch)})
              </span>
            </div>
            <input
              type="range"
              min={AUDIO_SETTINGS_RANGE.pitch.min}
              max={AUDIO_SETTINGS_RANGE.pitch.max}
              step={AUDIO_SETTINGS_RANGE.pitch.step}
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('tts.audioSettings.pitch.deep')}</span>
              <span>{t('tts.audioSettings.pitch.consistent')}</span>
              <span>{t('tts.audioSettings.pitch.crisp')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}