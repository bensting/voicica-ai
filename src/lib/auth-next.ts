/**
 * Auth.js 导出
 *
 * 提供认证相关的函数和组件
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
