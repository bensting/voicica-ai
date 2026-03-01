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
      <div className="mx-4 mt-2 rounded-full overflow-hidden border border-purple-500/15 bg-purple-950/40">
        <div className="flex items-center justify-between px-3 py-2.5">
          {/* Left: icon + $VOICICA + balance */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo/voicica-token.png" alt="" width={32} height={32} className="w-8 h-8" />
            <span className="text-amber-400 text-sm font-bold">$VOICICA</span>
            <span className="text-white font-bold text-sm tabular-nums tracking-tight">
              {creditsLoading ? <LoadingDots /> : formatCredits(credits)}
            </span>
          </div>
          {/* Right: BUY button */}
          <button
            onClick={handleBuy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs text-white active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            style={{ background: 'linear-gradient(135deg, #b45309, #d97706, #f59e0b)' }}
          >
            {t('native.common.buy')}
          </button>
        </div>
      </div>

      <NativeLoadingOverlay visible={navigating} />
    </>
  );
}
