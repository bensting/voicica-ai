import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  /** 使用深色版本（用于浅色背景） */
  dark?: boolean;
}

export default function Logo({ dark = true }: LogoProps) {
  // 少女粉滤镜：将透明logo转换为粉色
  const pinkFilter = 'brightness(0) saturate(100%) invert(56%) sepia(52%) saturate(4594%) hue-rotate(314deg) brightness(98%) contrast(91%)';

  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacitygroup">
      <Image
        src="/logo/flower-icon.png"
        alt="Logo"
        width={40}
        height={40}
        className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
      />
      {/* 
        Text Logo: Voicica.AI 
        "Voicica" -> Dark/Black
        ".AI" -> Pink Gradient
      */}
      <span className={`text-2xl md:text-3xl font-bold tracking-tight ${dark ? 'text-gray-900' : 'text-white'}`} style={{ fontFamily: 'var(--font-fredoka)' }}>
        Voicica
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-bold italic">
          .AI
        </span>
      </span>
    </Link>
  );
}