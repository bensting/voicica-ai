import Image from 'next/image';
import Link from 'next/link';

/**
 * 简洁 Footer — 品牌 + Privacy / Terms
 * 用于 (home) route group 下所有页面
 */
export default function SimpleFooter() {
  return (
    <footer className="bg-[#06060f] border-t border-white/10 py-6">
      <div className="max-w-md mx-auto px-4 flex flex-col items-center gap-3">
        {/* 品牌 */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo/logo-transparent-256.webp"
            alt="Voicica AI"
            width={20}
            height={20}
            className="h-5 w-5 rounded"
          />
          <span className="text-sm font-medium text-gray-400">Voicica AI</span>
        </div>

        {/* 链接 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* 版权 */}
        <p className="text-[10px] text-gray-600">
          &copy; {new Date().getFullYear()} Voicica.AI
        </p>
      </div>
    </footer>
  );
}
