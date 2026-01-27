import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <picture>
        <source srcSet="/logo/logo-full-transparent-light-256.webp" type="image/webp" />
        <Image
          src="/logo/logo-full-transparent-light.png"
          alt="Voicica.AI"
          width={180}
          height={40}
          priority
          className="h-10 md:h-12 w-auto object-contain"
        />
      </picture>
    </Link>
  );
}