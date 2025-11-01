import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image
        src="/logo/voice-labs-logo-dark.svg"
        alt="Voice-Labs.AI"
        width={180}
        height={32}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}