'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import LoadingDots from '@/components/native/common/LoadingDots';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMiningEconomyConfig } from '@/config/appConfig';

interface UserStatsBarProps {
  credits?: number;
  creditsLoading?: boolean;
}

/**
 * 用户余额卡片
 * 显示 $VOICICA 余额 + BUY 按钮，合并原 SubscribeCard
 */
export default function UserStatsBar({
  credits = 0,
  creditsLoading = false,
}: UserStatsBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { token_value_usd } = getMiningEconomyConfig();
  const [navigating, setNavigating] = useState(false);

  const usdtValue = credits * token_value_usd;
  const usdtDisplay = usdtValue === 0 ? '0' : usdtValue.toFixed(4);

  useEffect(() => {
    if (navigating) setNavigating(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuy = () => {
    setNavigating(true);
    router.push('/native/subscribe');
  };

  return (
    <>
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(180,83,9,0.25), rgba(217,119,6,0.15), rgba(245,158,11,0.10))' }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          {/* Left: balance */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo/voicica-token.png" alt="" width={28} height={28} className="w-7 h-7" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-bold text-xl leading-tight">
                  {creditsLoading ? <LoadingDots /> : credits.toFixed(4)}
                </span>
                <span className="text-amber-400/60 text-[11px] font-medium">$VOICICA</span>
              </div>
              <p className="text-white/25 text-[10px] mt-0.5">
                {creditsLoading ? '' : `≈ ${usdtDisplay} USDT`}
              </p>
            </div>
          </div>

          {/* Right: BUY button */}
          <button
            onClick={handleBuy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            style={{ background: 'linear-gradient(135deg, #b45309, #d97706, #f59e0b)' }}
          >
            <Image src="/logo/voicica-token.png" alt="" width={16} height={16} className="w-4 h-4" />
            {t('native.common.buy')}
          </button>
        </div>
      </div>

      {/* 导航 loading 遮罩 */}
      {navigating && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#060613]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
        </div>,
        document.body,
      )}
    </>
  );
}
