'use client';

import Link from 'next/link';
import Image from 'next/image';

/**
 * 分享链接已过期页面
 */
export default function SharedExpired() {
  return (
    <div className="h-screen bg-[#0a0a1a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link href="/">
          <Image
            src="/logo/logo-full-transparent-light.png"
            alt="Voicica AI"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </Link>
        <Link
          href="/"
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          Try Free
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-2">Link Expired</h1>
        <p className="text-gray-400 text-center mb-8 max-w-sm">
          This share link has expired. Share links are valid for 30 days after creation.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Your Own
        </Link>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 py-3 flex items-center justify-center gap-2 border-t border-white/10">
        <span className="text-gray-500 text-xs">Powered by</span>
        <Link href="/">
          <Image
            src="/logo/logo-full-transparent-light.png"
            alt="Voicica AI"
            width={80}
            height={20}
            className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
        </Link>
      </footer>
    </div>
  );
}
