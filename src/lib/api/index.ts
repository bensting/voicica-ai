/**
 * API 统一导出
 *
 * 使用方式：
 * import { userAPI, voiceAPI, subscriptionAPI, ttsAPI, enumsAPI, configAPI, sseAPI } from '@/lib/api'
 */

// 导出 API 客户端
export { apiClient } from './client';

// 导出用户相关 API
export * as userAPI from './user';

// 导出语音相关 API
export * as voiceAPI from './voice';

// 导出订阅相关 API
export * as subscriptionAPI from './subscription';

// 导出 TTS 相关 API
export * as ttsAPI from './tts';

// 导出枚举值 API
export * as enumsAPI from './enums';

// 导出配置相关 API
export * as configAPI from './config';

// 导出 SSE 相关 API
export * as sseAPI from './sse';