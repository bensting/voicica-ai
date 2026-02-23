import { IoLogoAndroid } from 'react-icons/io5';

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=ai.voicica.app';

function GooglePlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#EA4335"
        d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z"
      />
      <path
        fill="#FBBC04"
        d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z"
      />
      <path
        fill="#34A853"
        d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z"
      />
      <path
        fill="#4285F4"
        d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z"
      />
    </svg>
  );
}

function AppStoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/**
 * Google Play badge for SEO pages CTA sections.
 * Displays a Google Play download button + App Store Coming Soon.
 */
export default function SeoAppBadges() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 transition-colors hover:bg-white/10"
      >
        <GooglePlayIcon className="h-6 w-6" />
        <div className="text-left">
          <div className="text-[10px] uppercase leading-tight text-gray-400">
            Get it on
          </div>
          <div className="text-sm font-semibold leading-tight text-white">
            Google Play
          </div>
        </div>
      </a>

      <div className="inline-flex cursor-default items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-2.5 opacity-50">
        <AppStoreIcon className="h-6 w-6 text-gray-500" />
        <div className="text-left">
          <div className="text-[10px] uppercase leading-tight text-gray-500">
            Download on the
          </div>
          <div className="text-sm font-semibold leading-tight text-gray-400">
            App Store
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact download button for the SeoNavbar.
 */
export function NavbarDownloadButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
      aria-label="Download App"
    >
      <IoLogoAndroid className="h-4 w-4 text-[#3DDC84]" />
      <span className="hidden sm:inline">Download</span>
    </button>
  );
}
