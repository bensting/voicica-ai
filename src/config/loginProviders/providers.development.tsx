/**
 * 登录方式配置 - 开发环境
 *
 * 开发环境启用所有登录方式，方便测试
 */

import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebookSquare } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import type { LoginProviderConfig } from './types';

/**
 * 开发环境登录方式配置
 * 启用所有登录方式，方便开发测试
 * 使用方形容器 + 缩小的图标保持美观
 */
export const loginProviders: LoginProviderConfig[] = [
  {
    id: 'google',
    labelKey: 'login.signInWithGoogle',
    enabled: true,
    icon: <FcGoogle className="w-8 h-8" />,
    order: 1,
  },
  {
    id: 'apple',
    labelKey: 'login.signInWithApple',
    enabled: true,
    icon: <FaApple className="w-8 h-8" />,
    order: 2,
  },
  {
    id: 'twitter',
    labelKey: 'login.signInWithX',
    enabled: true,
    icon: <FaXTwitter className="w-8 h-8" />,
    order: 3,
  },
  {
    id: 'facebook',
    labelKey: 'login.signInWithFacebook',
    enabled: true,
    icon: <FaFacebookSquare className="w-8 h-8 text-[#1877F2]" />,
    order: 4,
  },
];