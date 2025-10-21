import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* 左侧品牌 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.svg"
                  alt="AI Voice Labs Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-semibold text-gray-900">AI Voice Labs</span>
            </div>
            <p className="text-gray-600 text-sm">
              The most human-like AI voices
            </p>
          </div>

          {/* 中间导航 */}
          <nav className="flex flex-col gap-2 md:text-center">
            <Link
              href="/#pricing"
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* 右侧法律 */}
          <nav className="flex flex-col gap-2 md:text-right">
            <Link
              href="/privacy"
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              Terms and Conditions
            </Link>
            <Link
              href="/refund"
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              Refund Policy
            </Link>
          </nav>
        </div>

        {/* 版权信息 */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} AI Voice Labs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}