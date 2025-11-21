/**
 * 用户菜单配置
 *
 * 定义用户下拉菜单中的所有菜单项
 */

export interface UserMenuItemConfig {
  id: string;
  labelKey: string; // i18n 翻译键
  href?: string; // 导航路径（可选）
  icon: React.ReactNode;
  variant?: 'default' | 'danger';
  action?: 'signout'; // 特殊操作
}

export const userMenuItems: UserMenuItemConfig[] = [
  {
    id: 'logout',
    labelKey: 'navbar.logout',
    action: 'signout',
    variant: 'danger',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
    ),
  },
];