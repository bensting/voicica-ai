/**
 * TTS Samples 模块统一导出
 *
 * 使用方式：
 * import TTSSamples from '@/components/sections/tts-samples'
 * import { useTTSDemo, useVoices, Voice } from '@/components/sections/tts-samples'
 */

// 主组件
export { default } from './TTSSamples';

// 子组件
export * from './components';

// Hooks
export * from './hooks';

// 重新导出 Voice 类型（方便使用）
export type { Voice } from '@/types/voice';
export { getLocalizedVoiceName } from '@/types/voice';