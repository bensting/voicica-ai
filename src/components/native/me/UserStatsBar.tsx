'use client';

import Image from 'next/image';
import LoadingDots from '@/components/native/common/LoadingDots';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserStatsBarProps {
  credits?: number;
  creditsLoading?: boolean;
}

/**
 * 用户信息栏
 * 显示 $VOICICA 余额，点击跳转购买页
 */
export default function UserStatsBar({
  credits = 0,
  creditsLoading = false,
}: UserStatsBarProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={() => { window.location.href = '/native/subscribe'; }}
      className="mx-4 flex items-center justify-center gap-2 py-2 active:opacity-70 transition-opacity"
    >
      <Image src="/logo/voicica-token.png" alt="" width={20} height={20} className="w-5 h-5" />
      <span className="text-amber-400 font-bold text-lg">
        {creditsLoading ? <LoadingDots /> : Math.floor(credits).toLocaleString()}
      </span>
      <span className="text-slate-500 text-xs font-medium">{t('native.subscribe.tokenLabel')}</span>
    </button>
  );
}
