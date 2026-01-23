'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getAdminVoiceList,
  getAdminVoiceLocales,
  updateVoiceStatus,
  batchUpdateVoiceStatus,
  getAdminVoiceById,
  updateVoice,
  generateVoiceSampleForVoice,
  generateVoiceAvatarUploadUrl,
  startElevenlabsSampleGeneration,
  checkElevenlabsSampleStatus,
  type SampleGenerationStatus,
} from '@/actions/admin/voices';
import {
  syncElevenlabsDialogueVoices,
  getElevenlabsDialogueStats,
} from '@/actions/admin/elevenlabs-dialogue-voices';

interface Voice {
  id: number;
  name: string;
  display_name: string;
  provider: string;
  locale: string;
  country: string;
  gender: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  style_list: string[];
  voice_sample_url: Record<string, string>;
  created_at: Date | null;
}

interface EditingVoice {
  id: number;
  name: string;
  display_name: string;
  locale: string;
  country: string;
  gender: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  style_list: string[];
  tags: string[];
  sort_order: number;
  voice_sample_url: Record<string, string>;
}

/**
 * 语音管理页面
 */
export default function VoicesManagementPage() {
  // 状态
  const [voices, setVoices] = useState<Voice[]>([]);
  const [locales, setLocales] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 筛选条件
  const [localeFilter, setLocaleFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [styleCountFilter, setStyleCountFilter] = useState('');

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 编辑模态框
  const [editingVoice, setEditingVoice] = useState<EditingVoice | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 生成样本
  const [generatingVoiceId, setGeneratingVoiceId] = useState<number | null>(null);

  // 音频播放
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingStyle, setPlayingStyle] = useState<string | null>(null);

  // 头像上传
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ElevenLabs Dialogue 同步
  const [syncingDialogue, setSyncingDialogue] = useState(false);
  const [dialogueStats, setDialogueStats] = useState<{ total: number; dbCount: number; activeCount: number } | null>(null);

  // ElevenLabs 样本生成模态框
  const [sampleGenModal, setSampleGenModal] = useState<{
    isOpen: boolean;
    voiceId: number;
    voiceName: string;
    taskId: string | null;
    status: SampleGenerationStatus['status'];
    error: string | null;
    startTime: number;
    elapsed: number;
  } | null>(null);
  const sampleGenPollingRef = useRef<NodeJS.Timeout | null>(null);

  // 解析风格数量筛选
  const getStyleCountParams = () => {
    if (!styleCountFilter) return {};
    switch (styleCountFilter) {
      case '1': return { styleCountMin: 1, styleCountMax: 1 };
      case '2-5': return { styleCountMin: 2, styleCountMax: 5 };
      case '6-10': return { styleCountMin: 6, styleCountMax: 10 };
      case '10+': return { styleCountMin: 11 };
      default: return {};
    }
  };

  // 加载语音列表
  const loadVoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminVoiceList({
        page,
        pageSize: 20,
        locale: localeFilter || undefined,
        gender: genderFilter || undefined,
        provider: providerFilter || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
        ...getStyleCountParams(),
      });
      setVoices(result.voices);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('加载语音列表失败:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, localeFilter, genderFilter, providerFilter, statusFilter, searchQuery, styleCountFilter]);

  // 加载 locale 列表
  const loadLocales = useCallback(async () => {
    try {
      const result = await getAdminVoiceLocales();
      setLocales(result);
    } catch (error) {
      console.error('加载 locale 列表失败:', error);
    }
  }, []);

  // 加载 ElevenLabs Dialogue 统计
  const loadDialogueStats = useCallback(async () => {
    try {
      const stats = await getElevenlabsDialogueStats();
      setDialogueStats(stats);
    } catch (error) {
      console.error('加载 Dialogue 统计失败:', error);
    }
  }, []);

  // 同步 ElevenLabs Dialogue 声音
  const handleSyncDialogue = async () => {
    setSyncingDialogue(true);
    try {
      const result = await syncElevenlabsDialogueVoices();
      if (result.success) {
        alert(result.message);
        loadDialogueStats();
        loadVoices();
      } else {
        alert(`同步失败: ${result.message}`);
      }
    } catch (error) {
      console.error('同步 Dialogue 声音失败:', error);
      alert('同步失败');
    } finally {
      setSyncingDialogue(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadLocales();
    loadDialogueStats();
  }, [loadLocales, loadDialogueStats]);

  // 清理轮询 interval
  useEffect(() => {
    return () => {
      if (sampleGenPollingRef.current) {
        clearInterval(sampleGenPollingRef.current);
      }
    };
  }, []);

  // 筛选变化时重新加载
  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  // 切换语音状态
  const handleToggleStatus = async (voiceId: number, currentStatus: boolean) => {
    const result = await updateVoiceStatus(voiceId, !currentStatus);
    if (result.success) {
      setVoices((prev) =>
        prev.map((v) => (v.id === voiceId ? { ...v, is_active: !currentStatus } : v))
      );
    }
  };

  // 批量操作
  const handleBatchAction = async (action: 'enable' | 'disable') => {
    if (selectedIds.length === 0) return;

    const result = await batchUpdateVoiceStatus(selectedIds, action === 'enable');
    if (result.success) {
      loadVoices();
      setSelectedIds([]);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === voices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(voices.map((v) => v.id));
    }
  };

  // 单选
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 重置筛选
  const handleResetFilters = () => {
    setLocaleFilter('');
    setGenderFilter('');
    setProviderFilter('');
    setStatusFilter('all');
    setSearchQuery('');
    setStyleCountFilter('');
    setPage(1);
  };

  // 打开编辑模态框
  const handleEdit = async (voiceId: number) => {
    setEditLoading(true);
    try {
      const voice = await getAdminVoiceById(voiceId);
      if (voice) {
        setEditingVoice(voice);
      }
    } catch (error) {
      console.error('加载语音详情失败:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingVoice) return;

    setSaving(true);
    try {
      const result = await updateVoice(editingVoice.id, {
        display_name: editingVoice.display_name,
        gender: editingVoice.gender,
        role: editingVoice.role,
        is_active: editingVoice.is_active,
        style_list: editingVoice.style_list,
        tags: editingVoice.tags,
        sort_order: editingVoice.sort_order,
        avatar_url: editingVoice.avatar_url,
      });

      if (result.success) {
        setEditingVoice(null);
        loadVoices();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新编辑中的语音字段
  const updateEditingField = <K extends keyof EditingVoice>(
    field: K,
    value: EditingVoice[K]
  ) => {
    if (!editingVoice) return;
    setEditingVoice({ ...editingVoice, [field]: value });
  };

  // 添加 style
  const handleAddStyle = () => {
    if (!editingVoice) return;
    const newStyle = prompt('输入新风格名称:');
    if (newStyle && !editingVoice.style_list.includes(newStyle)) {
      updateEditingField('style_list', [...editingVoice.style_list, newStyle]);
    }
  };

  // 删除 style
  const handleRemoveStyle = (style: string) => {
    if (!editingVoice) return;
    if (style === 'default') {
      alert('不能删除 default 风格');
      return;
    }
    updateEditingField(
      'style_list',
      editingVoice.style_list.filter((s) => s !== style)
    );
  };

  // 生成语音样本
  const handleGenerateSamples = async (voiceId: number, styleCount: number, provider: string) => {
    // ElevenLabs 使用异步模态框
    if (provider === 'elevenlabs_dialogue') {
      handleStartElevenlabsSample(voiceId);
      return;
    }

    if (!confirm(`确定要为此语音生成 ${styleCount} 个风格的样本吗？这会覆盖现有样本。`)) {
      return;
    }

    setGeneratingVoiceId(voiceId);
    try {
      const result = await generateVoiceSampleForVoice(voiceId);
      if (result.success) {
        alert(result.message);
      } else {
        alert(`生成失败: ${result.message}`);
      }
    } catch (error) {
      console.error('生成样本失败:', error);
      alert('生成样本失败');
    } finally {
      setGeneratingVoiceId(null);
      loadVoices();
    }
  };

  // 启动 ElevenLabs 样本生成
  const handleStartElevenlabsSample = async (voiceId: number) => {
    const voice = voices.find(v => v.id === voiceId);
    if (!voice) return;

    setSampleGenModal({
      isOpen: true,
      voiceId,
      voiceName: voice.display_name,
      taskId: null,
      status: 'pending',
      error: null,
      startTime: Date.now(),
      elapsed: 0,
    });

    try {
      const result = await startElevenlabsSampleGeneration(voiceId);
      if (!result.success || !result.taskId) {
        setSampleGenModal(prev => prev ? { ...prev, status: 'failed', error: result.error || '启动失败' } : null);
        return;
      }

      setSampleGenModal(prev => prev ? { ...prev, taskId: result.taskId!, status: 'processing' } : null);

      // 开始轮询
      startSamplePolling(voiceId, result.taskId);
    } catch {
      setSampleGenModal(prev => prev ? { ...prev, status: 'failed', error: '启动失败' } : null);
    }
  };

  // 轮询样本生成状态
  const startSamplePolling = (voiceId: number, taskId: string) => {
    console.log('🚀 开始轮询:', { voiceId, taskId });

    // 清除之前的轮询
    if (sampleGenPollingRef.current) {
      clearInterval(sampleGenPollingRef.current);
    }

    const maxDuration = 180000; // 3 分钟超时

    sampleGenPollingRef.current = setInterval(async () => {
      // 更新已用时间
      setSampleGenModal(prev => {
        if (!prev) return null;
        const elapsed = Date.now() - prev.startTime;
        if (elapsed >= maxDuration) {
          // 超时
          if (sampleGenPollingRef.current) {
            clearInterval(sampleGenPollingRef.current);
            sampleGenPollingRef.current = null;
          }
          return { ...prev, elapsed, status: 'failed', error: '生成超时，请点击"继续检查"按钮' };
        }
        return { ...prev, elapsed };
      });

      try {
        console.log('🔄 轮询检查状态...', { voiceId, taskId });
        const status = await checkElevenlabsSampleStatus(voiceId, taskId);
        console.log('🔄 返回状态:', status);

        if (status.status === 'completed') {
          if (sampleGenPollingRef.current) {
            clearInterval(sampleGenPollingRef.current);
            sampleGenPollingRef.current = null;
          }
          setSampleGenModal(prev => prev ? { ...prev, status: 'completed' } : null);
          loadVoices();
        } else if (status.status === 'failed') {
          if (sampleGenPollingRef.current) {
            clearInterval(sampleGenPollingRef.current);
            sampleGenPollingRef.current = null;
          }
          setSampleGenModal(prev => prev ? { ...prev, status: 'failed', error: status.error || '生成失败' } : null);
        }
      } catch (err) {
        console.error('🔄 轮询出错:', err);
      }
    }, 3000);
  };

  // 继续检查状态
  const handleContinueCheck = () => {
    if (sampleGenModal?.taskId) {
      setSampleGenModal(prev => prev ? { ...prev, status: 'processing', error: null, startTime: Date.now(), elapsed: 0 } : null);
      startSamplePolling(sampleGenModal.voiceId, sampleGenModal.taskId);
    }
  };

  // 关闭模态框
  const handleCloseSampleModal = () => {
    if (sampleGenPollingRef.current) {
      clearInterval(sampleGenPollingRef.current);
      sampleGenPollingRef.current = null;
    }
    setSampleGenModal(null);
    loadVoices();
  };

  // 播放样例语音
  const handlePlaySample = (style: string, url: string) => {
    // 如果正在播放同一个，则停止
    if (playingStyle === style && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingStyle(null);
      return;
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 创建新的音频并播放
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingStyle(style);

    audio.play().catch((err) => {
      console.error('播放失败:', err);
      setPlayingStyle(null);
    });

    audio.onended = () => {
      setPlayingStyle(null);
    };
  };

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingVoice || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 限制文件大小为 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // 获取预签名上传 URL
      const result = await generateVoiceAvatarUploadUrl(
        editingVoice.id,
        file.name,
        file.type
      );

      if (!result.success || !result.uploadUrl || !result.publicUrl) {
        throw new Error(result.message || '获取上传 URL 失败');
      }

      // 直接上传到 R2
      const uploadResponse = await fetch(result.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      // 更新本地状态
      updateEditingField('avatar_url', result.publicUrl);
    } catch (error) {
      console.error('上传头像失败:', error);
      alert(error instanceof Error ? error.message : '上传头像失败');
    } finally {
      setUploadingAvatar(false);
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">语音管理</h1>
          <p className="text-gray-600 mt-1">管理所有语音，启用或禁用语音</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ElevenLabs Dialogue 同步 */}
          <div className="flex items-center gap-2">
            {dialogueStats && (
              <span className="text-sm text-gray-500">
                Dialogue: {dialogueStats.dbCount}/{dialogueStats.total}
              </span>
            )}
            <button
              onClick={handleSyncDialogue}
              disabled={syncingDialogue}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {syncingDialogue ? '同步中...' : 'Dialogue 同步'}
            </button>
          </div>
          <Link
            href="/admin/voices/sync"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Azure 同步
          </Link>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索语音名称..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Locale 筛选 */}
          <select
            value={localeFilter}
            onChange={(e) => {
              setLocaleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有语言</option>
            {locales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.code} - {locale.name}
              </option>
            ))}
          </select>

          {/* 性别筛选 */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有性别</option>
            <option value="male">男声</option>
            <option value="female">女声</option>
          </select>

          {/* 服务商筛选 */}
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有服务商</option>
            <option value="microsoft">Microsoft</option>
            <option value="google">Google</option>
            <option value="fish">Fish Audio</option>
            <option value="elevenlabs_dialogue">ElevenLabs Dialogue</option>
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value="active">已启用</option>
            <option value="inactive">已禁用</option>
          </select>

          {/* 风格数量筛选 */}
          <select
            value={styleCountFilter}
            onChange={(e) => {
              setStyleCountFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有风格数量</option>
            <option value="1">1 个风格</option>
            <option value="2-5">2-5 个风格</option>
            <option value="6-10">6-10 个风格</option>
            <option value="10+">10+ 个风格</option>
          </select>

          {/* 重置 */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>

        {/* 批量操作 */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              已选择 {selectedIds.length} 个语音
            </span>
            <button
              onClick={() => handleBatchAction('enable')}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              批量启用
            </button>
            <button
              onClick={() => handleBatchAction('disable')}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              批量禁用
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              取消选择
            </button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mb-4 text-sm text-gray-600">共 {total} 个语音</div>

      {/* 语音列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === voices.length && voices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语音
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语言
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  服务商
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  性别
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  风格列表
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语音样本
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : voices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    没有找到语音
                  </td>
                </tr>
              ) : (
                voices.map((voice) => (
                  <tr key={voice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(voice.id)}
                        onChange={() => handleSelect(voice.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {voice.avatar_url ? (
                          <Image
                            src={voice.avatar_url}
                            alt={voice.display_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              {voice.gender === 'male' ? '♂' : '♀'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {voice.display_name}
                          </div>
                          <div className="text-xs text-gray-500">{voice.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{voice.locale}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          voice.provider === 'google'
                            ? 'bg-blue-100 text-blue-700'
                            : voice.provider === 'fish'
                              ? 'bg-teal-100 text-teal-700'
                              : voice.provider === 'elevenlabs_dialogue'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {voice.provider === 'google'
                          ? 'Google'
                          : voice.provider === 'fish'
                            ? 'Fish Audio'
                            : voice.provider === 'elevenlabs_dialogue'
                              ? 'ElevenLabs'
                              : 'Microsoft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          voice.gender === 'male'
                            ? 'bg-blue-100 text-blue-700'
                            : voice.gender === 'female'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {voice.gender === 'male' ? '男' : voice.gender === 'female' ? '女' : '未知'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {voice.style_list.slice(0, 2).map((style) => (
                          <span
                            key={style}
                            className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {style}
                          </span>
                        ))}
                        {voice.style_list.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{voice.style_list.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sampleCount = Object.keys(voice.voice_sample_url).length;
                        const styleCount = voice.style_list.length;
                        if (sampleCount === 0) {
                          return (
                            <span className="text-xs text-gray-400">无样本</span>
                          );
                        }
                        const isComplete = sampleCount >= styleCount;
                        return (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {Object.entries(voice.voice_sample_url).slice(0, 2).map(([style, url]) => (
                              <a
                                key={style}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                                title={`播放 ${style} 样本`}
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                {style}
                              </a>
                            ))}
                            {sampleCount > 2 && (
                              <span className="text-xs text-gray-400">+{sampleCount - 2}</span>
                            )}
                            <span className={`text-xs ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                              ({sampleCount}/{styleCount})
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          voice.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {voice.is_active ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(voice.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleGenerateSamples(voice.id, voice.style_list.length, voice.provider)}
                          disabled={generatingVoiceId === voice.id}
                          className="text-sm text-teal-600 hover:text-teal-700 disabled:opacity-50"
                        >
                          {generatingVoiceId === voice.id ? '生成中...' : '生成样本'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(voice.id, voice.is_active)}
                          className={`text-sm ${
                            voice.is_active
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {voice.is_active ? '禁用' : '启用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {(editingVoice || editLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {editLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                加载中...
              </div>
            ) : editingVoice ? (
              <>
                {/* 模态框头部 */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">编辑语音</h2>
                  <button
                    onClick={() => setEditingVoice(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 模态框内容 */}
                <div className="p-6 space-y-6">
                  {/* 基本信息 + 头像上传 */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="relative group">
                      {editingVoice.avatar_url ? (
                        <Image
                          src={editingVoice.avatar_url}
                          alt={editingVoice.display_name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-400">
                            {editingVoice.gender === 'male' ? '♂' : '♀'}
                          </span>
                        </div>
                      )}
                      {/* 上传按钮覆盖层 */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {uploadingAvatar ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{editingVoice.name}</div>
                      <div className="text-sm text-gray-500">
                        {editingVoice.locale} · {editingVoice.gender === 'male' ? '男' : '女'}
                      </div>
                    </div>
                  </div>

                  {/* 播放样例语音 */}
                  {Object.keys(editingVoice.voice_sample_url).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        试听样例
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(editingVoice.voice_sample_url).map(([style, url]) => (
                          <button
                            key={style}
                            onClick={() => handlePlaySample(style, url)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              playingStyle === style
                                ? 'bg-purple-100 border-purple-300 text-purple-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {playingStyle === style ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 显示名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      显示名称
                    </label>
                    <input
                      type="text"
                      value={editingVoice.display_name}
                      onChange={(e) => updateEditingField('display_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 性别 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      性别
                    </label>
                    <select
                      value={editingVoice.gender}
                      onChange={(e) => updateEditingField('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="unknown">未知</option>
                    </select>
                  </div>

                  {/* 角色类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色类型
                    </label>
                    <input
                      type="text"
                      value={editingVoice.role}
                      onChange={(e) => updateEditingField('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 排序 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      排序（数字越小越靠前）
                    </label>
                    <input
                      type="number"
                      value={editingVoice.sort_order}
                      onChange={(e) =>
                        updateEditingField('sort_order', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 状态 */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingVoice.is_active}
                        onChange={(e) => updateEditingField('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">启用此语音</span>
                    </label>
                  </div>

                  {/* 风格列表 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      风格列表
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editingVoice.style_list.map((style) => (
                        <span
                          key={style}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg"
                        >
                          {style}
                          {style !== 'default' && (
                            <button
                              onClick={() => handleRemoveStyle(style)}
                              className="text-purple-500 hover:text-purple-700"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleAddStyle}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      + 添加风格
                    </button>
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      标签（逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={editingVoice.tags.join(', ')}
                      onChange={(e) =>
                        updateEditingField(
                          'tags',
                          e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="如: news, emotional, podcast"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 模态框底部 */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingVoice(null)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ElevenLabs 样本生成模态框 */}
      {sampleGenModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">生成语音样本</h2>
              <p className="text-sm text-gray-500 mt-1">{sampleGenModal.voiceName}</p>
            </div>

            <div className="px-6 py-8">
              {/* 状态显示 */}
              <div className="flex flex-col items-center">
                {sampleGenModal.status === 'pending' && (
                  <>
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-700 font-medium">正在启动任务...</p>
                  </>
                )}

                {sampleGenModal.status === 'processing' && (
                  <>
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-700 font-medium">正在生成语音样本...</p>
                    <p className="text-gray-500 text-sm mt-2">
                      已用时: {Math.floor(sampleGenModal.elapsed / 1000)} 秒
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      ElevenLabs 生成可能需要 1-2 分钟
                    </p>
                  </>
                )}

                {sampleGenModal.status === 'completed' && (
                  <>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-700 font-medium">生成完成！</p>
                  </>
                )}

                {sampleGenModal.status === 'failed' && (
                  <>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-700 font-medium">生成失败</p>
                    <p className="text-red-500 text-sm mt-2">{sampleGenModal.error}</p>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              {sampleGenModal.status === 'failed' && sampleGenModal.taskId && (
                <button
                  onClick={handleContinueCheck}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  继续检查
                </button>
              )}
              <button
                onClick={handleCloseSampleModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {sampleGenModal.status === 'completed' ? '完成' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}