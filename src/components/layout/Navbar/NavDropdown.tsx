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
          className="flex items-center justify-between w-full text-gray-900 hover:text-purple-600 transition-colors font-medium py-2"
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
                    className="flex items-start gap-3 py-2 text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    {Icon && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-700" />
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
    <div
      ref={dropdownRef}
      className="relative h-16 flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-white hover:text-purple-400 transition-colors font-medium">
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
      {/* Purple underline indicator at navbar bottom */}
      <span
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 transition-transform origin-left ${
          isOpen ? 'scale-x-100' : 'scale-x-0'
        }`}
      />

      {isOpen && (
        <div className="absolute top-full left-0">
          <div className="p-3 bg-gray-100 shadow-xl border border-gray-200 border-t-0 min-w-[320px]">
            {dropdown.items
              .filter((item) => item.enabled !== false)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-white transition-colors"
                  >
                    {Icon && (
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" />
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
        </div>
      )}
    </div>
  );
}