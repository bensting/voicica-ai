import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image
        src="/logo/voice-labs-logo-dark.svg"
        alt="Voicica.AI"
        width={200}
        height={32}
        priority
        className="h-7 md:h-8 w-auto"
        style={{ width: 'auto' }}
      />
    </Link>
  );
}