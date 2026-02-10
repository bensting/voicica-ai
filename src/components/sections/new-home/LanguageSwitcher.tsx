import Link from 'next/link';

type Locale = 'en' | 'ja' | 'zh-Hant';

const languages: { locale: Locale; href: string; label: string }[] = [
  { locale: 'en', href: '/', label: 'English' },
  { locale: 'ja', href: '/ja', label: '日本語' },
  { locale: 'zh-Hant', href: '/tw', label: '繁體中文' },
];

export default function LanguageSwitcher({ current = 'en' }: { current?: Locale }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-gray-950 py-6 text-sm">
      {languages.map((lang, i) => (
        <span key={lang.locale} className="flex items-center gap-3">
          {i > 0 && <span className="text-gray-600">|</span>}
          <Link
            href={lang.href}
            className={current === lang.locale ? 'font-bold text-white' : 'text-gray-400 hover:text-gray-200'}
          >
            {lang.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
