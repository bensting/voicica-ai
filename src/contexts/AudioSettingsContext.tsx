'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from '@/types/audioSettings';

/**
 * 音频参数设置 Context
 *
 * 功能：
 * - 保存用户的音频参数偏好（语速、音量、音调）
 * - 提供全局访问和更新方法
 * - 持久化到 localStorage
 */

interface AudioSettingsContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
  resetSettings: () => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'tts_audio_settings';

interface AudioSettingsProviderProps {
  children: ReactNode;
}

export function AudioSettingsProvider({ children }: AudioSettingsProviderProps) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [isClient, setIsClient] = useState(false);

  // 标记客户端渲染完成
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 从 localStorage 加载设置
  useEffect(() => {
    if (!isClient) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AudioSettings;
        setSettings(parsed);
        console.log('[AudioSettings] 已从 localStorage 加载音频设置:', parsed);
      }
    } catch (error) {
      console.error('[AudioSettings] 加载音频设置失败:', error);
    }
  }, [isClient]);

  // 更新设置
  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // 保存到 localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log('[AudioSettings] 已保存音频设置:', updated);
      } catch (error) {
        console.error('[AudioSettings] 保存音频设置失败:', error);
      }

      return updated;
    });
  };

  // 重置设置
  const resetSettings = () => {
    setSettings(DEFAULT_AUDIO_SETTINGS);

    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[AudioSettings] 已重置音频设置');
    } catch (error) {
      console.error('[AudioSettings] 重置音频设置失败:', error);
    }
  };

  return (
    <AudioSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

/**
 * 使用音频设置的 Hook
 */
export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);

  if (context === undefined) {
    throw new Error('useAudioSettings must be used within AudioSettingsProvider');
  }

  return context;
}