interface FlagIconProps {
  /** ISO 3166-1 alpha-2 国家代码 */
  countryCode: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 国旗图标组件
 *
 * 使用 flagcdn.com 提供的圆形国旗图标
 * 支持所有 ISO 3166-1 alpha-2 国家代码
 *
 * 特点：
 * - 圆形设计，现代美观
 * - 使用正方形容器确保完美圆形
 * - CDN 加速，快速加载
 * - 桌面端完美显示
 */
export default function FlagIcon({ countryCode, size = 'md' }: FlagIconProps) {
  const sizeMap = {
    sm: 20,
    md: 28,
    lg: 32,
  };

  const dimension = sizeMap[size];

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 bg-gray-700"
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
        alt={`${countryCode} flag`}
        width={dimension}
        height={dimension}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}