/**
 * Me 页面专用布局
 * 不显示顶部导航栏，只保留底部导航
 */
export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
