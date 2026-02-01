'use client';

import Link from 'next/link';
import CrownIcon from '@/components/native/common/CrownIcon';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * 订阅推广卡片
 * 引导用户订阅获取更多功能
 */
export default function SubscribeCard() {
  const { t } = useLanguage();

  return (
    <div className="mx-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/80 to-purple-600/80 p-4">
        {/* 装饰背景 */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>

        {/* 内容 */}
        <div className="relative z-10">
          <h3 className="text-white font-semibold mb-3">
            {t('native.me.subscribe.subtitle')}
          </h3>
          <Link
            href="/native/subscribe"
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/90 rounded-full text-purple-700 font-medium text-sm hover:bg-white transition-colors"
          >
            <CrownIcon className="w-4 h-4" />
            {t('native.me.subscribe.button')}
          </Link>
        </div>
      </div>
    </div>
  );
}
