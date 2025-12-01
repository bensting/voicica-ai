'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  syncGoogleVoicesByLocale,
  getGoogleVoiceStatsByLocale,
  getGoogleVoicesByLocale,
  syncGoogleVoiceAvatars,
  syncGoogleVoiceAvatarsByLocale,
  syncGoogleVoiceSamplesByLocale,
  regenerateAllGoogleAvatars,
  syncAllGoogleVoices,
  updateAllGoogleVoices,
} from '@/actions/admin/google-voices';
import { SyncResult, ConfirmDialogState } from './types';

/**
 * 语音详情
 */
export interface GoogleVoiceDetail {
  name: string;
  displayName: string;
  gender: string;
  sampleRate: number;
  tags: string[];
}

/**
 * 查看弹窗状态
 */
export interface VoiceDetailDialogState {
  isOpen: boolean;
  locale: string;
  localeName: string;
  voices: GoogleVoiceDetail[];
  loading: boolean;
}

/**
 * Google 语音统计
 */
export interface GoogleLocaleStats {
  locale: string;
  localeName: string;
  googleCount: number;
  dbCount: number;
  sampleCount: number;
  avatarCount: number;
  canSync: boolean;
}

/**
 * Google 语音同步管理 Hook
 */
export function useGoogleVoiceSync() {
  const [locales, setLocales] = useState<GoogleLocaleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [localeFilter, setLocaleFilter] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [voiceDetailDialog, setVoiceDetailDialog] = useState<VoiceDetailDialogState>({
    isOpen: false,
    locale: '',
    localeName: '',
    voices: [],
    loading: false,
  });

  // 过滤后的 locales
  const filteredLocales = locales.filter((item) => {
    if (!localeFilter) return true;
    const search = localeFilter.toLowerCase();
    return (
      item.locale.toLowerCase().includes(search) ||
      item.localeName.toLowerCase().includes(search)
    );
  });

  // 加载 locale 列表和统计
  const loadLocales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoogleVoiceStatsByLocale();
      setLocales(data);
    } catch (error) {
      console.error('加载 Google 语言列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocales();
  }, [loadLocales]);

  // 同步指定 locale 的语音
  const handleSync = useCallback(async (locale: string) => {
    setSyncing(locale);
    try {
      const result = await syncGoogleVoicesByLocale(locale);
      setSyncResults((prev) => ({ ...prev, [locale]: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [locale]: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 基础同步所有
  const handleSyncAll = useCallback(async () => {
    setSyncing('all');
    try {
      const result = await syncAllGoogleVoices();
      setSyncResults((prev) => ({ ...prev, all: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        all: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 更新所有语音数据
  const handleUpdateAll = useCallback(async () => {
    setSyncing('update-all');
    try {
      const result = await updateAllGoogleVoices();
      setSyncResults((prev) => ({ ...prev, 'update-all': result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        'update-all': {
          success: false,
          message: error instanceof Error ? error.message : '更新失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 同步头像（只更新空头像）
  const handleSyncAvatars = useCallback(async () => {
    setSyncing('avatars');
    try {
      const result = await syncGoogleVoiceAvatars();
      setSyncResults((prev) => ({ ...prev, avatars: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        avatars: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 重新生成全部头像
  const handleRegenerateAllAvatars = useCallback(async () => {
    setSyncing('regenerate');
    try {
      const result = await regenerateAllGoogleAvatars();
      setSyncResults((prev) => ({ ...prev, regenerate: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        regenerate: {
          success: false,
          message: error instanceof Error ? error.message : '重新生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 查看指定 locale 的语音列表
  const handleViewVoices = useCallback(async (locale: string, localeName: string) => {
    setVoiceDetailDialog({
      isOpen: true,
      locale,
      localeName,
      voices: [],
      loading: true,
    });

    try {
      const result = await getGoogleVoicesByLocale(locale);
      setVoiceDetailDialog((prev) => ({
        ...prev,
        voices: result.voices,
        loading: false,
      }));
    } catch (error) {
      console.error('获取语音列表失败:', error);
      setVoiceDetailDialog((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  const closeVoiceDetailDialog = useCallback(() => {
    setVoiceDetailDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 按 locale 生成语音样例
  const handleSyncSamplesByLocale = useCallback(async (locale: string) => {
    const syncKey = `samples-${locale}`;
    setSyncing(syncKey);
    try {
      const result = await syncGoogleVoiceSamplesByLocale(locale);
      setSyncResults((prev) => ({ ...prev, [syncKey]: result }));
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [syncKey]: {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, []);

  // 按 locale 生成头像
  const handleSyncAvatarsByLocale = useCallback(async (locale: string) => {
    const syncKey = `avatars-${locale}`;
    setSyncing(syncKey);
    try {
      const result = await syncGoogleVoiceAvatarsByLocale(locale);
      setSyncResults((prev) => ({ ...prev, [syncKey]: result }));
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [syncKey]: {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, []);

  return {
    // 状态
    locales,
    filteredLocales,
    loading,
    syncing,
    syncResults,
    localeFilter,
    confirmDialog,
    voiceDetailDialog,
    // 方法
    setLocaleFilter,
    loadLocales,
    handleSync,
    handleSyncAll,
    handleUpdateAll,
    handleSyncAvatars,
    handleRegenerateAllAvatars,
    closeConfirmDialog,
    handleViewVoices,
    closeVoiceDetailDialog,
    handleSyncSamplesByLocale,
    handleSyncAvatarsByLocale,
  };
}