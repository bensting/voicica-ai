'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * VOICICA 购买推广卡片
 * 引导用户购买 VOICICA 代币
 */
export default function SubscribeCard() {
  const { t } = useLanguage();

  return (
    <div className="mx-4 mt-1">
      <button
        onClick={() => { window.location.href = '/native/subscribe'; }}
        className="block relative overflow-hidden rounded-2xl p-4 w-full text-left"
        style={{ background: 'linear-gradient(135deg, rgba(180,83,9,0.3), rgba(217,119,6,0.2), rgba(245,158,11,0.15))' }}
      >
        {/* Decorative glow */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm mb-1">
              {t('native.me.subscribe.title')}
            </h3>
            <p className="text-amber-400/70 text-xs">
              {t('native.me.subscribe.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #b45309, #d97706, #f59e0b)' }}
          >
            <Image src="/logo/voicica-token.png" alt="" width={16} height={16} className="w-4 h-4" />
            {t('native.common.buy')}
          </div>
        </div>
      </button>
    </div>
  );
}
