'use client';

import { useState, useEffect } from 'react';
import { getAllFeatureFlags, updateFeatureFlags, getTtsMaxCharacters, updateTtsMaxCharacters, type FeatureFlags } from '@/actions/admin/system-config';
import { createMenuItems } from '@/config/native/createMenuConfig';

const FEATURE_LABELS: Record<string, string> = {
  voice: 'Text to Voice',
  dialogue: 'Text to Dialogue',
  clone: 'Voice Clone',
  music: 'AI Music',
  image: 'AI Image',
  'image-tools': 'BG Remover & HD Upscaler',
  video: 'AI Video',
  'video-downloader': 'Video Downloader',
};

function FlagCard({
  title,
  subtitle,
  flags,
  onToggle,
  onSave,
  saving,
  saved,
}: {
  title: string;
  subtitle: string;
  flags: FeatureFlags | null;
  onToggle: (key: keyof FeatureFlags) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="divide-y divide-gray-100">
        {flags === null ? (
          <div className="px-6 py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          createMenuItems.map((item) => {
            const key = item.id as keyof FeatureFlags;
            if (!(key in flags)) return null;
            const enabled = flags[key];
            return (
              <div key={item.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{FEATURE_LABELS[item.id] || item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <button
                  onClick={() => onToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className={`text-sm transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          ✓ 保存成功
        </span>
        <button
          onClick={onSave}
          disabled={saving || flags === null}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export default function SystemConfigPage() {
  const [prodFlags, setProdFlags] = useState<FeatureFlags | null>(null);
  const [devFlags, setDevFlags] = useState<FeatureFlags | null>(null);
  const [savingProd, setSavingProd] = useState(false);
  const [savingDev, setSavingDev] = useState(false);
  const [savedProd, setSavedProd] = useState(false);
  const [savedDev, setSavedDev] = useState(false);

  const [ttsMaxChars, setTtsMaxChars] = useState<number>(500);
  const [savingTts, setSavingTts] = useState(false);
  const [savedTts, setSavedTts] = useState(false);

  useEffect(() => {
    getAllFeatureFlags().then(({ prod, dev }) => {
      setProdFlags(prod);
      setDevFlags(dev);
    });
    getTtsMaxCharacters().then(setTtsMaxChars);
  }, []);

  const handleSaveTtsMaxChars = async () => {
    setSavingTts(true);
    await updateTtsMaxCharacters(ttsMaxChars);
    setSavingTts(false);
    setSavedTts(true);
    setTimeout(() => setSavedTts(false), 2000);
  };

  const handleSave = async (scope: 'prod' | 'dev') => {
    const flags = scope === 'prod' ? prodFlags : devFlags;
    if (!flags) return;
    if (scope === 'prod') {
      setSavingProd(true);
      await updateFeatureFlags(flags, 'prod');
      setSavingProd(false);
      setSavedProd(true);
      setTimeout(() => setSavedProd(false), 2000);
    } else {
      setSavingDev(true);
      await updateFeatureFlags(flags, 'dev');
      setSavingDev(false);
      setSavedDev(true);
      setTimeout(() => setSavedDev(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
        <p className="text-sm text-gray-500 mt-1">管理全局功能开关和系统参数</p>
      </div>

      <FlagCard
        title="功能入口与标签显示（生产环境）"
        subtitle="控制首页功能入口、Explore 标签和 My Creations 标签的显示与隐藏"
        flags={prodFlags}
        onToggle={(key) => prodFlags && setProdFlags({ ...prodFlags, [key]: !prodFlags[key] })}
        onSave={() => handleSave('prod')}
        saving={savingProd}
        saved={savedProd}
      />

      {/* 参数设置 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">参数设置</h2>
          <p className="text-sm text-gray-500 mt-0.5">控制各功能的数值限制</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">TTS 最大输入字符数</p>
            <p className="text-xs text-gray-400 mt-0.5">Text to Voice / Dialogue 页面的字符上限</p>
          </div>
          <input
            type="number"
            min={100}
            max={10000}
            value={ttsMaxChars}
            onChange={(e) => setTtsMaxChars(Number(e.target.value))}
            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className={`text-sm transition-opacity ${savedTts ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
            ✓ 保存成功
          </span>
          <button
            onClick={handleSaveTtsMaxChars}
            disabled={savingTts}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {savingTts ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <FlagCard
        title="功能入口与标签显示（开发环境）"
        subtitle="本地 npm run dev 时读取此配置，与生产环境独立"
        flags={devFlags}
        onToggle={(key) => devFlags && setDevFlags({ ...devFlags, [key]: !devFlags[key] })}
        onSave={() => handleSave('dev')}
        saving={savingDev}
        saved={savedDev}
      />
    </div>
  );
}
