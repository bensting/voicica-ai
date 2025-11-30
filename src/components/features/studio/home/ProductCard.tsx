'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt?: string;
}

/**
 * 明星产品卡片组件
 *
 * 横向布局：左侧文字，右侧留白展示背景图
 * 使用 Next.js Image 组件保持图片原始比例
 */
export default function ProductCard({
  title,
  description,
  href,
  image,
  imageAlt,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className="group relative block rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* 背景图片 - 保持原始比例 */}
      <Image
        src={image}
        alt={imageAlt || title}
        width={800}
        height={600}
        className="w-full h-auto object-cover"
      />

      {/* 左上角半透明遮罩 + 内容 */}
      <div className="absolute top-0 left-0 w-3/5 bg-gradient-to-r from-white via-white/95 to-transparent p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}