/**
 * Mobile Bottom Navigation 类型定义
 */

export interface MobileNavItemConfig {
  id: string;
  icon: React.ReactNode;
  labelKey: string; // i18n 翻译键
  href: string;
  enabled?: boolean; // 是否启用，默认为 true
}
