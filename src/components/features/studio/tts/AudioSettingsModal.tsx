'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudioSettings } from '@/contexts/AudioSettingsContext';
import { AUDIO_SETTINGS_RANGE } from '@/types/audioSettings';
import { Clock, Volume2, Sliders, X } from 'lucide-react';

/**
 * 移动端音频参数设置弹窗
 *
 * 功能：
 * - 3个选项卡：语速、音量、音调
 * - 滑块调节参数
 * - 保存设置到 Context
 */

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'speed' | 'volume' | 'pitch';

export default function AudioSettingsModal({ isOpen, onClose }: AudioSettingsModalProps) {
  const { t } = useLanguage();
  const { settings, updateSettings } = useAudioSettings();
  const [activeTab, setActiveTab] = useState<Tab>('speed');

  // 临时状态（保存前可以调整）
  const [tempSettings, setTempSettings] = useState(settings);

  // 同步 settings 到 tempSettings
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(tempSettings);
    onClose();
  };

  const getPitchLabel = (value: number) => {
    if (value <= 10) return t('studio.audioSettings.pitch.deep');
    if (value <= 35) return t('studio.audioSettings.pitch.dull');
    if (value <= 65) return t('studio.audioSettings.pitch.consistent');
    if (value <= 90) return t('studio.audioSettings.pitch.bright');
    return t('studio.audioSettings.pitch.crisp');
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    {
      id: 'speed',
      icon: <Clock className="w-5 h-5" />,
      label: t('studio.audioSettings.speed.title'),
    },
    {
      id: 'volume',
      icon: <Volume2 className="w-5 h-5" />,
      label: t('studio.audioSettings.volume.title'),
    },
    {
      id: 'pitch',
      icon: <Sliders className="w-5 h-5" />,
      label: t('studio.audioSettings.pitch.title'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-xl">
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 pt-4">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Speed Tab */}
          {activeTab === 'speed' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('studio.audioSettings.speed.title')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('studio.audioSettings.speed.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-block bg-purple-50 text-purple-600 text-2xl font-bold px-6 py-3 rounded-xl">
                  {tempSettings.speed}x
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t('studio.audioSettings.speed.current')}
                </p>
                <input
                  type="range"
                  min={AUDIO_SETTINGS_RANGE.speed.min}
                  max={AUDIO_SETTINGS_RANGE.speed.max}
                  step={AUDIO_SETTINGS_RANGE.speed.step}
                  value={tempSettings.speed}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, speed: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{AUDIO_SETTINGS_RANGE.speed.min}x</span>
                  <span>{AUDIO_SETTINGS_RANGE.speed.max}x</span>
                </div>
              </div>
            </div>
          )}

          {/* Volume Tab */}
          {activeTab === 'volume' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('studio.audioSettings.volume.title')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('studio.audioSettings.volume.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-block bg-purple-50 text-purple-600 text-2xl font-bold px-6 py-3 rounded-xl">
                  {tempSettings.volume}%
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t('studio.audioSettings.volume.current')}
                </p>
                <input
                  type="range"
                  min={AUDIO_SETTINGS_RANGE.volume.min}
                  max={AUDIO_SETTINGS_RANGE.volume.max}
                  step={AUDIO_SETTINGS_RANGE.volume.step}
                  value={tempSettings.volume}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, volume: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{AUDIO_SETTINGS_RANGE.volume.min}%</span>
                  <span>{AUDIO_SETTINGS_RANGE.volume.max}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Tab */}
          {activeTab === 'pitch' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('studio.audioSettings.pitch.title')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('studio.audioSettings.pitch.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-block bg-purple-50 text-purple-600 text-2xl font-bold px-6 py-3 rounded-xl">
                  {tempSettings.pitch}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t('studio.audioSettings.pitch.current')}
                </p>
                <input
                  type="range"
                  min={AUDIO_SETTINGS_RANGE.pitch.min}
                  max={AUDIO_SETTINGS_RANGE.pitch.max}
                  step={AUDIO_SETTINGS_RANGE.pitch.step}
                  value={tempSettings.pitch}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, pitch: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{t('studio.audioSettings.pitch.deep')}</span>
                  <span>{t('studio.audioSettings.pitch.dull')}</span>
                  <span>{t('studio.audioSettings.pitch.consistent')}</span>
                  <span>{t('studio.audioSettings.pitch.bright')}</span>
                  <span>{t('studio.audioSettings.pitch.crisp')}</span>
                </div>
                <div className="text-center mt-2 text-sm font-medium text-purple-600">
                  {getPitchLabel(tempSettings.pitch)}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full mt-6 bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            {t('studio.audioSettings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}