/**
 * 音频参数设置类型定义
 */

/**
 * 音频参数设置接口
 */
export interface AudioSettings {
  /** 语速：0.5x - 2x，默认 1x */
  speed: number;
  /** 音量：0% - 100%，默认 50% */
  volume: number;
  /** 音调：0 - 100，默认 50（Consistent） */
  pitch: number;
}

/**
 * 默认音频参数设置
 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  speed: 1.0,
  volume: 50,
  pitch: 50,
};

/**
 * 音频参数范围配置
 */
export const AUDIO_SETTINGS_RANGE = {
  speed: {
    min: 0.5,
    max: 2.0,
    step: 0.1,
  },
  volume: {
    min: 1,
    max: 100,
    step: 1,
  },
  pitch: {
    min: 1,
    max: 100,
    step: 1,
  },
} as const;

/**
 * 音调标签映射
 */
export const PITCH_LABELS = {
  0: 'Deep',
  25: 'Dull',
  50: 'Consistent',
  75: 'Bright',
  100: 'Crisp',
} as const;