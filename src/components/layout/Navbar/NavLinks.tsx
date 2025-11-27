'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent } from 'react';
import { NAV_LINKS, NAV_DROPDOWNS } from '@/config/navigation/index';
import { useLanguage } from '@/contexts/LanguageContext';
import NavDropdown from './NavDropdown';

interface NavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
}

export default function NavLinks({ mobile = false, onLinkClick }: NavLinksProps = {}) {
  const pathname = usePathname();
  const { t } = useLanguage();

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
      <div className="flex flex-col space-y-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
            className="text-white hover:text-purple-400 transition-colors font-medium py-2"
          >
            {t(link.labelKey)}
          </Link>
        ))}
        {NAV_DROPDOWNS.map((dropdown) => (
          <NavDropdown key={dropdown.id} dropdown={dropdown} mobile onLinkClick={onLinkClick} />
        ))}
      </div>
    );
  }

  // Render first link (Studio), then dropdowns, then remaining links
  const firstLink = NAV_LINKS[0];
  const remainingLinks = NAV_LINKS.slice(1);

  return (
    <div className="hidden md:flex items-center space-x-8">
      {firstLink && (
        <Link
          href={firstLink.href}
          onClick={getClickHandler(firstLink.type, firstLink.sectionId, firstLink.openInNewWindow, firstLink.href)}
          className="text-white hover:text-purple-400 transition-colors font-medium"
        >
          {t(firstLink.labelKey)}
        </Link>
      )}
      {NAV_DROPDOWNS.map((dropdown) => (
        <NavDropdown key={dropdown.id} dropdown={dropdown} />
      ))}
      {remainingLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={getClickHandler(link.type, link.sectionId, link.openInNewWindow, link.href)}
          className="text-white hover:text-purple-400 transition-colors font-medium"
        >
          {t(link.labelKey)}
        </Link>
      ))}
    </div>
  );
}