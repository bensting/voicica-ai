'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { studioMenuCategories } from '@/config/studioMenuConfig';

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile Side Menu (Drawer)
 *
 * Slides in from left when hamburger is clicked
 */
export default function MobileSideMenu({ isOpen, onClose }: MobileSideMenuProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide Menu */}
      <div
        className={`
          fixed top-[60px] left-0 bottom-0 w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
        `}
      >
        <nav className="py-4">
          {/* Main Section */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                {t('studio.menu.home')}
              </span>
            </div>
            {studioMenuCategories.main.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>

          {/* Video AI Section */}
          {studioMenuCategories.video.length > 0 && (
            <div className="mb-6">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Video AI
                </span>
              </div>
              {studioMenuCategories.video.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 transition-colors
                      ${isActive
                        ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Voiceover AI Section */}
          {studioMenuCategories.voiceover.length > 0 && (
            <div className="mb-6">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Voiceover AI
                </span>
              </div>
              {studioMenuCategories.voiceover.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 transition-colors
                      ${isActive
                        ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Music AI Section */}
          {studioMenuCategories.music.length > 0 && (
            <div className="mb-6">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Music AI
                </span>
              </div>
              {studioMenuCategories.music.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 transition-colors
                      ${isActive
                        ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </>
  );
}