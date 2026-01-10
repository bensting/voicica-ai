'use client';

import Link from 'next/link';
import { isNativeApp } from '@/lib/capacitor';

/**
 * 返回首页按钮
 * - 在原生 App 中：跳转到 /studio
 * - 在 Web 中：跳转到 /
 */
export default function BackToHomeButton() {
  const href = isNativeApp() ? '/studio' : '/';

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-6"
    >
      Back to Home
    </Link>
  );
}