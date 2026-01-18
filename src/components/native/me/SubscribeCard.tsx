'use client';

import Link from 'next/link';

// 星星图标
const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
  </svg>
);

/**
 * 订阅推广卡片
 * 引导用户订阅获取更多功能
 */
export default function SubscribeCard() {
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
            More credits & features
          </h3>
          <Link
            href="/native/subscribe"
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/90 rounded-full text-purple-700 font-medium text-sm hover:bg-white transition-colors"
          >
            <StarIcon />
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}
