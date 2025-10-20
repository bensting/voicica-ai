/**
 * @deprecated
 * 此文件已被弃用，请使用 @/lib/api 代替
 *
 * 迁移指南：
 * - import { apiClient } from '@/services/api' → import { apiClient } from '@/lib/api'
 * - import { userAPI } from '@/services/api' → import { userAPI } from '@/lib/api'
 * - import { voiceAPI } from '@/services/api' → import { voiceAPI } from '@/lib/api'
 * - import { subscriptionAPI } from '@/services/api' → import { subscriptionAPI } from '@/lib/api'
 * - import { enumsAPI } from '@/services/api' → import { enumsAPI } from '@/lib/api'
 */

// 为了向后兼容，重新导出新的 API 模块
export { apiClient, userAPI, voiceAPI, subscriptionAPI, enumsAPI } from '@/lib/api';