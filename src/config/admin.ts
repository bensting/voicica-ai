/**
 * 管理员配置
 * 集中管理管理员相关的配置项
 */

// 管理员邮箱白名单
export const ADMIN_EMAILS = [
  'admin@voicica.ai',
  'bensting19@gmail.com',
];

/**
 * 检查邮箱是否为管理员
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}