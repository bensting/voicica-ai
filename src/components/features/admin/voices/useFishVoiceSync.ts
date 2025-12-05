'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFishPopularVoices,
  syncFishPopularVoices,
  updateFishVoices,
  syncFishVoiceAvatars,
  syncFishVoice,
  deleteFishVoice,
} from '@/actions/admin/fish-voices';
import { SyncResult, ConfirmDialogState } from './types';

/**
 * Fish 语音详情
 */
export interface FishVoiceDetail {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  languages: string[];
  author: string;
  taskCount: number;
  likeCount: number;
  tags: string[];
  samples: Array<{
    title: string;
    text: string;
    audioUrl: string;
  }>;
}

/**
 * 查看弹窗状态
 */
export interface FishVoiceDetailDialogState {
  isOpen: boolean;
  voice: FishVoiceDetail | null;
}

// 排序选项
export const SORT_BY_OPTIONS = [
  { value: 'score', label: '热度' },
  { value: 'task_count', label: '使用次数' },
  { value: 'created_at', label: '创建时间' },
];

/**
 * Fish 语音同步管理 Hook
 */
export function useFishVoiceSync() {
  const [voices, setVoices] = useState<FishVoiceDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false); // 改为 false，不自动加载
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 默认按热度排序
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [hasSearched, setHasSearched] = useState(false); // 是否已执行过搜索
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [voiceDetailDialog, setVoiceDetailDialog] = useState<FishVoiceDetailDialogState>({
    isOpen: false,
    voice: null,
  });

  // 过滤后的 voices
  const filteredVoices = voices.filter((voice) => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return (
      voice.title.toLowerCase().includes(search) ||
      voice.author.toLowerCase().includes(search) ||
      voice.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  // 加载 Fish 语音列表
  const loadVoices = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await getFishPopularVoices(
        pageSize,
        pageNumber,
        languageFilter || undefined,
        sortBy || undefined
      );
      setVoices(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('加载 Fish 语音列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, pageNumber, languageFilter, sortBy]);

  // 移除自动加载，改为手动触发
  // 翻页时自动加载（如果已经执行过搜索）
  useEffect(() => {
    if (hasSearched && pageNumber > 1) {
      loadVoices();
    }
  }, [pageNumber, hasSearched, loadVoices]);

  // 同步热门语音（批量）
  const handleSyncPopular = useCallback(
    async (count: number = 50) => {
      setSyncing('popular');
      try {
        const result = await syncFishPopularVoices(count, languageFilter || undefined);
        setSyncResults((prev) => ({ ...prev, popular: result }));
        if (result.success) {
          await loadVoices();
        }
      } catch (error) {
        setSyncResults((prev) => ({
          ...prev,
          popular: {
            success: false,
            message: error instanceof Error ? error.message : '同步失败',
          },
        }));
      } finally {
        setSyncing(null);
      }
    },
    [languageFilter, loadVoices]
  );

  // 更新所有语音数据
  const handleUpdateAll = useCallback(async () => {
    setSyncing('update-all');
    try {
      const result = await updateFishVoices();
      setSyncResults((prev) => ({ ...prev, 'update-all': result }));
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
  }, []);

  // 同步头像
  const handleSyncAvatars = useCallback(async () => {
    setSyncing('avatars');
    try {
      const result = await syncFishVoiceAvatars();
      setSyncResults((prev) => ({ ...prev, avatars: result }));
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
  }, []);

  // 同步单个语音（默认语言，zh -> zh-CN）
  const handleSyncSingle = useCallback(async (modelId: string) => {
    const syncKey = `single-${modelId}`;
    setSyncing(syncKey);
    try {
      const result = await syncFishVoice(modelId);
      setSyncResults((prev) => ({ ...prev, [syncKey]: result }));
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [syncKey]: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, []);

  // 同步单个语音到繁体中文（zh-TW）
  const handleSyncToTW = useCallback(async (modelId: string) => {
    const syncKey = `single-tw-${modelId}`;
    setSyncing(syncKey);
    try {
      const result = await syncFishVoice(modelId, 'zh-TW');
      setSyncResults((prev) => ({ ...prev, [syncKey]: result }));
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [syncKey]: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  }, []);

  // 删除语音
  const handleDelete = useCallback(
    async (voiceId: number, voiceName: string) => {
      setConfirmDialog({
        isOpen: true,
        title: '确认删除',
        message: `确定要删除语音 "${voiceName}" 吗？此操作不可恢复。`,
        onConfirm: async () => {
          const syncKey = `delete-${voiceId}`;
          setSyncing(syncKey);
          try {
            const result = await deleteFishVoice(voiceId);
            setSyncResults((prev) => ({ ...prev, [syncKey]: result }));
            if (result.success) {
              await loadVoices();
            }
          } catch (error) {
            setSyncResults((prev) => ({
              ...prev,
              [syncKey]: {
                success: false,
                message: error instanceof Error ? error.message : '删除失败',
              },
            }));
          } finally {
            setSyncing(null);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        },
      });
    },
    [loadVoices]
  );

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 查看语音详情
  const handleViewVoice = useCallback((voice: FishVoiceDetail) => {
    setVoiceDetailDialog({
      isOpen: true,
      voice,
    });
  }, []);

  const closeVoiceDetailDialog = useCallback(() => {
    setVoiceDetailDialog({ isOpen: false, voice: null });
  }, []);

  // 翻页
  const handlePageChange = useCallback((page: number) => {
    setPageNumber(page);
  }, []);

  // 切换语言筛选（同时重置页码）
  const handleLanguageFilterChange = useCallback((language: string) => {
    setLanguageFilter(language);
    setPageNumber(1); // 重置到第一页
  }, []);

  // 下载 Excel（使用 API Route + fetch 下载，需要传递 token）
  const [exporting, setExporting] = useState(false);
  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      // 获取 Firebase token
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('请先登录');
        return;
      }
      const token = await user.getIdToken();

      // 请求 API
      const url = `/api/admin/fish-voices/export${languageFilter ? `?language=${languageFilter}` : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'fish_voices.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // 下载文件
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出 Excel 失败:', error);
      alert(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExporting(false);
    }
  }, [languageFilter]);

  // 搜索方法（点击搜索按钮时调用）
  const handleSearch = useCallback(() => {
    setPageNumber(1); // 重置到第一页
    loadVoices();
  }, [loadVoices]);

  return {
    // 状态
    voices,
    filteredVoices,
    total,
    loading,
    syncing,
    syncResults,
    searchFilter,
    languageFilter,
    sortBy,
    pageNumber,
    pageSize,
    confirmDialog,
    voiceDetailDialog,
    exporting,
    // 方法
    setSearchFilter,
    setLanguageFilter: handleLanguageFilterChange, // 使用新的方法，会重置页码
    setSortBy,
    loadVoices,
    handleSearch, // 新增搜索方法
    handleSyncPopular,
    handleUpdateAll,
    handleSyncAvatars,
    handleSyncSingle,
    handleSyncToTW,
    handleDelete,
    closeConfirmDialog,
    handleViewVoice,
    closeVoiceDetailDialog,
    handlePageChange,
    handleExportExcel,
  };
}