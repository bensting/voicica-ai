import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  /** 使用深色版本（用于浅色背景） */
  dark?: boolean;
}

export default function Logo({ dark = true }: LogoProps) {
  // 紫色滤镜：将透明logo转换为紫色
  const purpleFilter = 'brightness(0) saturate(100%) invert(26%) sepia(89%) saturate(1583%) hue-rotate(246deg) brightness(91%) contrast(101%)';

  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image
        src={dark ? "/logo/voice-labs-logo-light.svg" : "/logo/voice-labs-logo-dark.svg"}
        alt="Voicica.AI"
        width={200}
        height={32}
        priority
        className="h-7 md:h-8 w-auto"
        style={{
          width: 'auto',
          filter: dark ? purpleFilter : undefined,
        }}
      />
    </Link>
  );
}