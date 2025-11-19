/**
 * Auth.js API 路由
 */
import { handlers } from '@/lib/auth-next';

export const runtime = 'edge';

export const { GET, POST } = handlers;
