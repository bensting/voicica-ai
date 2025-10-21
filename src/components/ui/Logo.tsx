import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-12 h-12 relative">
        <Image
          src="/logo.svg"
          alt="AI Voice Labs Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="text-lg md:text-xl font-semibold text-gray-900">AI Voice Labs</span>
    </Link>
  );
}