'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingDots from '@/components/native/common/LoadingDots';
import NativeLoadingOverlay from '@/components/native/common/NativeLoadingOverlay';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { formatCredits } from '@/utils/formatCredits';
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
  const { t } = useLanguage();
  const { token_value_usd } = getMiningEconomyConfig();
  const { navigating, startLoading } = useNavigationLoading();

  const usdtValue = credits * token_value_usd;
  const usdtDisplay = usdtValue === 0 ? '0' : parseFloat(usdtValue.toFixed(4)).toString();

  const handleBuy = () => {
    startLoading();
    router.push('/native/subscribe');
  };

  return (
    <>
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden border border-amber-500/10"
        style={{ background: 'linear-gradient(135deg, rgba(180,83,9,0.20), rgba(30,20,10,0.60))' }}
      >
        <div className="px-4 py-3">
          {/* Row 1: icon + $VOICICA (left), balance (right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo/voicica-token.png" alt="" width={28} height={28} className="w-7 h-7" />
              <span className="text-amber-400 text-sm font-semibold">$VOICICA</span>
            </div>
            <span className="text-white font-bold text-base tabular-nums">
              {creditsLoading ? <LoadingDots /> : formatCredits(credits)}
            </span>
          </div>
          {/* Row 2: ≈ USDT (left), BUY button (right) */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-gray-500 text-[11px] pl-[38px]">
              {creditsLoading ? '' : `≈ ${usdtDisplay} USDT`}
            </span>
            <button
              onClick={handleBuy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs text-white active:scale-95 transition-all shadow-lg shadow-amber-500/25"
              style={{ background: 'linear-gradient(135deg, #b45309, #d97706, #f59e0b)' }}
            >
              <Image src="/logo/voicica-token.png" alt="" width={14} height={14} className="w-3.5 h-3.5" />
              {t('native.common.buy')}
            </button>
          </div>
        </div>
      </div>

      <NativeLoadingOverlay visible={navigating} />
    </>
  );
}
