'use client';

import FloatingButton from '@/components/ui/FloatingButton';

/**
 * FloatingActions - 客户端组件包装器
 *
 * 用于在布局中使用 FloatingButton，避免服务端组件传递事件处理函数的错误
 */
export default function FloatingActions() {
  const handleClick = () => {
    // 可以添加下载桌面快捷方式的功能
    // 或者打开 PWA 安装提示
    console.log('Download shortcut clicked');

    // 示例：如果是 PWA，可以触发安装提示
    // if ('BeforeInstallPromptEvent' in window) {
    //   // 触发 PWA 安装
    // }
  };

  // 自定义桌面快捷方式图标（类似参考图片）
  const DesktopShortcutIcon = () => (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 外框 - 代表窗口/应用 */}
      <rect
        x="4"
        y="3"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* 底座 - 代表桌面 */}
      <path
        d="M8 21h8M12 17v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 下载箭头或添加符号 */}
      <path
        d="M12 7v4m0 0l2-2m-2 2l-2-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <FloatingButton
      icon={<DesktopShortcutIcon />}
      text="Shortcut on your desktop."
      onClick={handleClick}
    />
  );
}