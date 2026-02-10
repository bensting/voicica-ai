import Link from 'next/link';

export default function LanguageSwitcher({ current = 'en' }: { current?: 'en' | 'ja' }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-gray-950 py-6 text-sm">
      <Link
        href="/"
        className={current === 'en' ? 'font-bold text-white' : 'text-gray-400 hover:text-gray-200'}
      >
        English
      </Link>
      <span className="text-gray-600">|</span>
      <Link
        href="/ja"
        className={current === 'ja' ? 'font-bold text-white' : 'text-gray-400 hover:text-gray-200'}
      >
        日本語
      </Link>
    </div>
  );
}
