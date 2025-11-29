/**
 * 登录方式配置 - 生产环境
 *
 * 生产环境只启用已完成配置的登录方式
 */

import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebookSquare } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import type { LoginProviderConfig } from './types';

/**
 * 生产环境登录方式配置
 * 根据实际需求启用/禁用特定登录方式
 * 使用方形容器 + 缩小的图标保持美观
 */
export const loginProviders: LoginProviderConfig[] = [
  {
    id: 'google',
    labelKey: 'login.signInWithGoogle',
    enabled: true, // Google 登录已配置
    icon: <FcGoogle className="w-8 h-8" />,
    order: 1,
  },
  {
    id: 'apple',
    labelKey: 'login.signInWithApple',
    enabled: true, // Apple 登录已配置
    icon: <FaApple className="w-8 h-8" />,
    order: 2,
  },
  {
    id: 'twitter',
    labelKey: 'login.signInWithX',
    enabled: true, // Twitter/X 登录已配置
    icon: <FaXTwitter className="w-8 h-8" />,
    order: 3,
  },
  {
    id: 'facebook',
    labelKey: 'login.signInWithFacebook',
    enabled: false, // Facebook 登录待配置（暂时禁用）
    icon: <FaFacebookSquare className="w-8 h-8 text-[#1877F2]" />,
    order: 4,
  },
];