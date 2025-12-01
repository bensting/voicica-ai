'use client';

import { SiGoogle } from 'react-icons/si';

interface ProviderIconProps {
  provider: string;
  className?: string;
}

/**
 * Microsoft logo SVG component (4 colored squares)
 */
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" fill="none" aria-label="Microsoft">
      <title>Microsoft</title>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/**
 * Provider icon component for voice providers (Google, Microsoft, etc.)
 *
 * Usage:
 * <ProviderIcon provider="google" className="w-3.5 h-3.5" />
 * <ProviderIcon provider="microsoft" className="w-4 h-4" />
 */
export default function ProviderIcon({ provider, className = 'w-3.5 h-3.5' }: ProviderIconProps) {
  switch (provider) {
    case 'google':
      // Google icon looks visually larger, scale down slightly
      return <SiGoogle className={`${className} text-[#4285F4] scale-90`} title="Google" />;
    case 'microsoft':
      return <MicrosoftIcon className={className} />;
    default:
      return null;
  }
}