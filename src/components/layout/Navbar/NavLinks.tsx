'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent } from 'react';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/explore', label: 'Explore' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/my-voice-models', label: 'My Voice Models' },
  { href: '/generation-history', label: 'Generation History' },
];

interface NavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
}

export default function NavLinks({ mobile = false, onLinkClick }: NavLinksProps = {}) {
  const pathname = usePathname();

  const handleSectionClick = (sectionId: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    onLinkClick?.();
  };

  const handleClick = () => {
    onLinkClick?.();
  };

  const getClickHandler = (label: string) => {
    if (label === 'Pricing') return handleSectionClick('pricing');
    if (label === 'FAQ') return handleSectionClick('faq');
    return handleClick;
  };

  if (mobile) {
    return (
      <div className="flex flex-col space-y-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={getClickHandler(link.label)}
            className="text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-8">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={getClickHandler(link.label)}
          className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}