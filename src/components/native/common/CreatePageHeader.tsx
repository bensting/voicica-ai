'use client';

import { useRouter } from 'next/navigation';

interface CreatePageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export default function CreatePageHeader({ title, rightContent }: CreatePageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 bg-[#0a0a1a]"
      style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white font-semibold">{title}</span>
        {rightContent || <div className="w-10" />}
      </div>
    </header>
  );
}
