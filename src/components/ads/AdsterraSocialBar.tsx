'use client';

import { useEffect, useRef } from 'react';
import { getSocialBarConfig, isSocialBarEnabled } from '@/config/ads/adsterra';

/**
 * Adsterra Social Bar 广告组件
 *
 * Social Bar 是一种固定在页面底部的广告形式
 * 脚本会自动处理广告的显示和定位
 */
export default function AdsterraSocialBar() {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // 检查是否启用
    if (!isSocialBarEnabled()) return;

    // 防止重复加载
    if (scriptLoadedRef.current) return;

    const config = getSocialBarConfig();
    const scriptUrl = config.scriptUrl;

    // 检查脚本是否已存在
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      return;
    }

    // 创建并加载脚本
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('[AdsterraSocialBar] Script loaded successfully');
    };

    script.onerror = () => {
      // 广告脚本加载失败是正常情况（可能被广告拦截器阻止）
      console.warn('[AdsterraSocialBar] Failed to load script (may be blocked by ad blocker)');
    };

    // 添加到 body 末尾
    document.body.appendChild(script);

    return () => {
      // 组件卸载时不移除脚本，因为 Social Bar 是全局的
    };
  }, []);

  // Social Bar 由脚本自动渲染，无需返回 DOM 元素
  return null;
}
