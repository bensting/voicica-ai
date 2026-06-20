'use client';

interface CreatePageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export default function CreatePageHeader({ title, rightContent }: CreatePageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 bg-[#0a0a1a]"
      style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-10" />
        <span className="text-white font-semibold">{title}</span>
        {rightContent || <div className="w-10" />}
      </div>
    </header>
  );
}
