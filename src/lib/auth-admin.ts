/**
 * 管理员权限验证工具
 */
import { cookies } from 'next/headers';

/**
 * 验证管理员权限（检查 admin_session cookie）
 */
export async function verifyAdminWithoutDb(): Promise<void> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;

  if (session !== 'authenticated') {
    throw new Error('未登录');
  }
}

/**
 * 验证管理员权限（需要数据库，同上保持兼容）
 */
export async function verifyAdmin(): Promise<void> {
  return verifyAdminWithoutDb();
}
