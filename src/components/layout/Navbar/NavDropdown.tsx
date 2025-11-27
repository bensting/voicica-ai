'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NavDropdown as NavDropdownType } from '@/config/navigation/index';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavDropdownProps {
  dropdown: NavDropdownType;
  mobile?: boolean;
  onLinkClick?: () => void;
}

export default function NavDropdown({ dropdown, mobile = false, onLinkClick }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
    onLinkClick?.();
  };

  if (mobile) {
    return (
      <div className="py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-white hover:text-purple-400 transition-colors font-medium py-2"
        >
          <span>{t(dropdown.labelKey)}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="pl-4 mt-2 space-y-1">
            {dropdown.items
              .filter((item) => item.enabled !== false)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 py-2 text-gray-300 hover:text-purple-400 transition-colors"
                  >
                    {Icon && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{t(item.labelKey)}</div>
                      {item.descriptionKey && (
                        <div className="text-sm text-gray-500">{t(item.descriptionKey)}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-white hover:text-purple-400 transition-colors font-medium"
      >
        <span>{t(dropdown.labelKey)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-gray-900 rounded-xl shadow-xl border border-gray-800 min-w-[280px]">
          {dropdown.items
            .filter((item) => item.enabled !== false)
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {Icon && (
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{t(item.labelKey)}</div>
                    {item.descriptionKey && (
                      <div className="text-sm text-gray-500">{t(item.descriptionKey)}</div>
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}