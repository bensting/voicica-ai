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
                  {creditsLoading ? <LoadingDots /> : formatCredits(credits)}
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

      <NativeLoadingOverlay visible={navigating} />
    </>
  );
}
