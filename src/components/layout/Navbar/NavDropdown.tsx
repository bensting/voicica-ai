'use client';

import { useState, useRef, useEffect, isValidElement } from 'react';
import Link from 'next/link';
import { NavDropdown as NavDropdownType } from '@/config/navigation/index';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavDropdownProps {
  dropdown: NavDropdownType;
  mobile?: boolean;
  onLinkClick?: () => void;
  labelIcon?: React.ReactNode;
}

// Helper to render icon (supports both ComponentType and ReactNode)
function renderIcon(icon: React.ComponentType<{ className?: string }> | React.ReactNode, className: string) {
  if (!icon) return null;
  // Check if it's a valid React element (ReactNode)
  if (isValidElement(icon)) {
    return icon;
  }
  // Otherwise treat as ComponentType
  const Icon = icon as React.ComponentType<{ className?: string }>;
  return <Icon className={className} />;
}

export default function NavDropdown({ dropdown, mobile = false, onLinkClick, labelIcon }: NavDropdownProps) {
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
      <div className="border-b border-gray-50 last:border-b-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center justify-between w-full p-3 rounded-xl transition-all font-medium ${isOpen ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <span className="flex items-center">
            {t(dropdown.labelKey)}
            {labelIcon}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 text-gray-400 group-hover:text-pink-500 ${isOpen ? 'rotate-180 text-pink-500' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="pl-4 pr-2 pb-2 pt-1 space-y-1">
            {dropdown.items
              .filter((item) => item.enabled !== false)
              .map((item) => {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    {item.icon && (
                      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-pink-500">
                        {renderIcon(item.icon, "w-4 h-4")}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{t(item.labelKey)}</div>
                      {item.descriptionKey && (
                        <div className="text-xs text-gray-400 truncate mt-0.5">{t(item.descriptionKey)}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="relative h-10 flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-300 font-medium ${isOpen ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:text-pink-500 hover:bg-white/50'
        }`}>
        <span>{t(dropdown.labelKey)}</span>
        {labelIcon}
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Card */}
      <div className={`absolute top-full left-0 pt-2 transition-all duration-300 transform origin-top-left ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'
        }`}>
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 p-2 min-w-[280px] overflow-hidden">
          {dropdown.items
            .filter((item) => item.enabled !== false)
            .map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors"
                >
                  {item.icon && (
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-50 rounded-lg flex items-center justify-center text-pink-500 group-hover:text-pink-600 group-hover:scale-110 transition-all duration-300">
                      {renderIcon(item.icon, "w-5 h-5")}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors text-sm">{t(item.labelKey)}</div>
                    {item.descriptionKey && (
                      <div className="text-xs text-gray-500 group-hover:text-pink-400/80 mt-0.5 leading-relaxed">{t(item.descriptionKey)}</div>
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}