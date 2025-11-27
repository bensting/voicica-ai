'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent, useMemo } from 'react';
import { NAV_LINKS, NAV_DROPDOWNS, type NavLink, type NavDropdown as NavDropdownType } from '@/config/navigation/index';
import { useLanguage } from '@/contexts/LanguageContext';
import NavDropdown from './NavDropdown';

interface NavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
}

type NavItem =
  | { type: 'link'; data: NavLink }
  | { type: 'dropdown'; data: NavDropdownType };

export default function NavLinks({ mobile = false, onLinkClick }: NavLinksProps = {}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Build ordered navigation items based on insertAfter configuration
  const orderedItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [];

    for (const link of NAV_LINKS) {
      items.push({ type: 'link', data: link });

      // Find dropdowns that should be inserted after this link
      const dropdownsAfter = NAV_DROPDOWNS.filter(d => d.insertAfter === link.href);
      for (const dropdown of dropdownsAfter) {
        items.push({ type: 'dropdown', data: dropdown });
      }
    }

    // Add dropdowns without insertAfter at the end
    const dropdownsWithoutPosition = NAV_DROPDOWNS.filter(d => !d.insertAfter);
    for (const dropdown of dropdownsWithoutPosition) {
      items.push({ type: 'dropdown', data: dropdown });
    }

    return items;
  }, []);

  const handleSectionClick = (sectionId?: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/' && sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        // 只有当元素存在时才阻止默认行为并滚动
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 如果元素不存在，允许正常导航到对应页面
    }
    onLinkClick?.();
  };

  const handleNewWindowClick = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
    onLinkClick?.();
  };

  const handleClick = () => {
    onLinkClick?.();
  };

  const getClickHandler = (type?: string, sectionId?: string, openInNewWindow?: boolean, href?: string) => {
    // openInNewWindow only applies to desktop (non-mobile) view
    if (openInNewWindow && href && !mobile) return handleNewWindowClick(href);
    if (type === 'section') return handleSectionClick(sectionId);
    return handleClick;
  };

  if (mobile) {
    return (
      <div className="flex flex-col">
        {orderedItems.map((item, index) => {
          if (item.type === 'link') {
            const link = item.data;
            const isLast = index === orderedItems.length - 1;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
                className={`text-gray-900 hover:text-purple-600 transition-colors font-medium py-3 ${
                  !isLast ? 'border-b border-gray-100' : ''
                }`}
              >
                {t(link.labelKey)}
              </Link>
            );
          } else {
            return (
              <NavDropdown key={item.data.id} dropdown={item.data} mobile onLinkClick={onLinkClick} />
            );
          }
        })}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-8">
      {orderedItems.map((item) => {
        if (item.type === 'link') {
          const link = item.data;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
              className="text-white hover:text-purple-400 transition-colors font-medium"
            >
              {t(link.labelKey)}
            </Link>
          );
        } else {
          return <NavDropdown key={item.data.id} dropdown={item.data} />;
        }
      })}
    </div>
  );
}