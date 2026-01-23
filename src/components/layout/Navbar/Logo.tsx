import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  /** 使用深色版本（用于浅色背景） */
  dark?: boolean;
}

export default function Logo({ dark = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image
        src="/logo/voice-labs-logo-dark.svg"
        alt="Voicica.AI"
        width={200}
        height={32}
        priority
        className={`h-7 md:h-8 w-auto ${dark ? 'brightness-0' : ''}`}
        style={{ width: 'auto' }}
      />
    </Link>
  );
}