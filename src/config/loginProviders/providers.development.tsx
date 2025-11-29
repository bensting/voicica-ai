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
 * 使用 react-icons 确保图标大小一致
 */
export const loginProviders: LoginProviderConfig[] = [
  {
    id: 'google',
    labelKey: 'login.signInWithGoogle',
    enabled: true, // 开发环境启用
    icon: <FcGoogle className="w-10 h-10" />,
    order: 1,
  },
  {
    id: 'apple',
    labelKey: 'login.signInWithApple',
    enabled: true, // 开发环境启用
    icon: <FaApple className="w-10 h-10" />,
    order: 2,
  },
  {
    id: 'twitter',
    labelKey: 'login.signInWithX',
    enabled: true, // 开发环境启用
    icon: <FaXTwitter className="w-10 h-10" />,
    order: 3,
  },
  {
    id: 'facebook',
    labelKey: 'login.signInWithFacebook',
    enabled: true, // 开发环境启用
    icon: <FaFacebookSquare className="w-10 h-10 text-[#1877F2]" />,
    order: 4,
  },
];