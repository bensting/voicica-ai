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
    const addedDropdownIds = new Set<string>();

    // Helper to add a dropdown and its dependents recursively
    const addDropdownWithDependents = (dropdown: NavDropdownType) => {
      if (addedDropdownIds.has(dropdown.id)) return;

      items.push({ type: 'dropdown', data: dropdown });
      addedDropdownIds.add(dropdown.id);

      // Find dropdowns that should be inserted after this dropdown
      const dropdownsAfter = NAV_DROPDOWNS.filter(d => d.insertAfter === dropdown.id);
      for (const dep of dropdownsAfter) {
        addDropdownWithDependents(dep);
      }
    };

    // First, add dropdowns without insertAfter (they come first)
    const dropdownsWithoutPosition = NAV_DROPDOWNS.filter(d => !d.insertAfter);
    for (const dropdown of dropdownsWithoutPosition) {
      addDropdownWithDependents(dropdown);
    }

    // Then add links, with dropdowns inserted after matching links
    for (const link of NAV_LINKS) {
      items.push({ type: 'link', data: link });

      // Find dropdowns that should be inserted after this link (by href)
      const dropdownsAfterLink = NAV_DROPDOWNS.filter(d => d.insertAfter === link.href && !addedDropdownIds.has(d.id));
      for (const dropdown of dropdownsAfterLink) {
        addDropdownWithDependents(dropdown);
      }
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

  // Helper to add icons to specific nav items specific to the design
  const getLabelIcon = (key: string) => {
    // 可以根据分类添加特殊图标
    if (key === 'studio.category.tools') return <span className="ml-1 text-lg">🎁</span>;
    return null;
  };

  if (mobile) {
    return (
      <div className="flex flex-col space-y-1">
        {orderedItems.map((item) => {
          if (item.type === 'link') {
            const link = item.data;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
                className="group flex items-center justify-between p-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all font-medium"
              >
                <div className="flex items-center">
                  {t(link.labelKey)}
                  {getLabelIcon(link.labelKey)}
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-pink-400 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            );
          } else {
            return (
              <NavDropdown
                key={item.data.id}
                dropdown={item.data}
                mobile
                onLinkClick={onLinkClick}
                labelIcon={getLabelIcon(item.data.labelKey)}
              />
            );
          }
        })}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-1">
      {orderedItems.map((item) => {
        if (item.type === 'link') {
          const link = item.data;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
              className="text-gray-700 hover:text-pink-500 transition-colors font-medium px-4 py-2 rounded-full hover:bg-white/50"
            >
              {t(link.labelKey)}
              {getLabelIcon(link.labelKey)}
            </Link>
          );
        } else {
          return (
            <NavDropdown
              key={item.data.id}
              dropdown={item.data}
              labelIcon={getLabelIcon(item.data.labelKey)}
            />
          );
        }
      })}
    </div>
  );
}