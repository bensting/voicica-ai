/**
 * Studio 首页功能入口类型定义
 */

export interface StudioFeatureItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  enabled?: boolean; // 是否启用，默认为 true
}
