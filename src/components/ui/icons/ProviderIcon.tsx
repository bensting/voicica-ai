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
 * Fish Audio logo SVG component (waveform)
 */
function FishAudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="Fish Audio">
      <title>Fish Audio</title>
      <rect x="1" y="9" width="2" height="6" rx="1" opacity="0.6" />
      <rect x="4.5" y="7" width="2" height="10" rx="1" opacity="0.7" />
      <rect x="8" y="4" width="2" height="16" rx="1" opacity="0.85" />
      <rect x="11.5" y="2" width="2" height="20" rx="1" />
      <rect x="15" y="5" width="2" height="14" rx="1" opacity="0.85" />
      <rect x="18.5" y="8" width="2" height="8" rx="1" opacity="0.7" />
      <rect x="22" y="10" width="2" height="4" rx="1" opacity="0.6" />
    </svg>
  );
}

/**
 * Provider icon component for voice providers (Google, Microsoft, Fish Audio, etc.)
 *
 * Usage:
 * <ProviderIcon provider="google" className="w-3.5 h-3.5" />
 * <ProviderIcon provider="microsoft" className="w-4 h-4" />
 * <ProviderIcon provider="fish audio" className="w-4 h-4" />
 */
export default function ProviderIcon({ provider, className = 'w-3.5 h-3.5' }: ProviderIconProps) {
  switch (provider) {
    case 'google':
      // Google icon looks visually larger, scale down slightly
      return <SiGoogle className={`${className} text-[#4285F4] scale-90`} title="Google" />;
    case 'microsoft':
      return <MicrosoftIcon className={className} />;
    case 'fish audio':
      return <FishAudioIcon className={`${className} text-gray-300`} />;
    default:
      return null;
  }
}