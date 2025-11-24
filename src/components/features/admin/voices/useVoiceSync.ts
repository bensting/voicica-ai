'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  syncVoicesByLocale,
  getVoiceStatsByLocale,
  syncVoiceAvatars,
  regenerateAllAvatars,
  generateVoiceSamples,
  generateAllVoiceSamples,
  clearVoiceSamples,
  updateAllVoices,
} from '@/actions/admin/voices';
import { LocaleStats, SyncResult, ConfirmDialogState } from './types';

/**
 * 语音同步管理 Hook
 */
export function useVoiceSync() {
  const [locales, setLocales] = useState<LocaleStats[]>([]);
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
      const data = await getVoiceStatsByLocale();
      setLocales(data);
    } catch (error) {
      console.error('加载语言列表失败:', error);
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
      const result = await syncVoicesByLocale(locale);
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
    let totalInserted = 0;
    let totalSkipped = 0;
    const failedLocales: string[] = [];

    for (const item of locales) {
      if (item.canSync) {
        try {
          const result = await syncVoicesByLocale(item.locale);
          if (result.success) {
            totalInserted += result.inserted || 0;
            totalSkipped += result.skipped || 0;
          } else {
            failedLocales.push(item.locale);
          }
          setSyncResults((prev) => ({ ...prev, [item.locale]: result }));
        } catch {
          failedLocales.push(item.locale);
        }
      }
    }

    setSyncing(null);
    await loadLocales();

    setSyncResults((prev) => ({
      ...prev,
      all: {
        success: failedLocales.length === 0,
        message:
          failedLocales.length === 0
            ? '全部同步完成'
            : `部分同步失败: ${failedLocales.join(', ')}`,
        inserted: totalInserted,
        skipped: totalSkipped,
      },
    }));
  }, [locales, loadLocales]);

  // 更新所有语音数据
  const handleUpdateAll = useCallback(async () => {
    setSyncing('update-all');
    try {
      const result = await updateAllVoices();
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
      const result = await syncVoiceAvatars();
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
      const result = await regenerateAllAvatars();
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

  // 生成指定 locale 的语音样本
  const handleGenerateSamples = useCallback(async (locale: string) => {
    setSyncing(`sample-${locale}`);
    try {
      const result = await generateVoiceSamples(locale);
      setSyncResults((prev) => ({ ...prev, [`sample-${locale}`]: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [`sample-${locale}`]: {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 批量生成所有语音样本
  const handleGenerateAllSamples = useCallback(async () => {
    setSyncing('samples-all');
    try {
      const result = await generateAllVoiceSamples();
      setSyncResults((prev) => ({ ...prev, 'samples-all': result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        'samples-all': {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, [loadLocales]);

  // 清空指定 locale 的语音样本
  const handleClearSamples = useCallback((locale: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '清空语音样本',
      message: `确定要清空 ${locale} 的所有语音样本吗？此操作不可撤销。`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setSyncing(`clear-${locale}`);
        try {
          const result = await clearVoiceSamples(locale);
          setSyncResults((prev) => ({ ...prev, [`clear-${locale}`]: result }));
          if (result.success) {
            await loadLocales();
          }
        } catch (error) {
          setSyncResults((prev) => ({
            ...prev,
            [`clear-${locale}`]: {
              success: false,
              message: error instanceof Error ? error.message : '清空失败',
            },
          }));
        } finally {
          setSyncing(null);
        }
      },
    });
  }, [loadLocales]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
    // 方法
    setLocaleFilter,
    loadLocales,
    handleSync,
    handleSyncAll,
    handleUpdateAll,
    handleSyncAvatars,
    handleRegenerateAllAvatars,
    handleGenerateSamples,
    handleGenerateAllSamples,
    handleClearSamples,
    closeConfirmDialog,
  };
}
