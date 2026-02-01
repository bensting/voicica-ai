'use client';

import { useLanguage, locales, type Locale } from '@/contexts/LanguageContext';

interface LanguageSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Native App 语言选择器 - 底部弹出样式
 */
export default function LanguageSelectorSheet({
  isOpen,
  onClose,
}: LanguageSelectorSheetProps) {
  const { locale, setLocale } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code: Locale) => {
    setLocale(code);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[10000]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-slate-900 rounded-t-2xl animate-slide-up max-h-[70vh] flex flex-col"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Language</h3>
              <p className="text-gray-400 text-sm">Select your preferred language</p>
            </div>
          </div>
        </div>

        {/* Language List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors ${
                  locale === loc.code
                    ? 'bg-purple-500/20 border border-purple-500'
                    : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                }`}
              >
                <span className={`text-base ${locale === loc.code ? 'text-purple-400 font-medium' : 'text-white'}`}>
                  {loc.nativeName}
                </span>
                {locale === loc.code && (
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
