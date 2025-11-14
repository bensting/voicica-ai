// TTS 任务状态枚举
export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

// TTS 记录接口
export interface TtsRecord {
  id: string;
  text: string;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  duration?: number;
  character_count: number;
  audio_url?: string;
  error_message?: string;
  voice_id?: string;
  voice_name?: string;
  voice?: {
    id: string;
    name: string;
    display_name: Record<string, string>;
    avatar_url: string;
    [key: string]: unknown;
  }; // 关联的语音信息（仅在查询时填充）
}

// 查询 TTS 记录的请求参数
export interface TtsRecordsQueryParams {
  status?: TaskStatus;
  start_date?: string;  // ISO 8601 format
  end_date?: string;    // ISO 8601 format
  page?: number;
  page_size?: number;
}

// 查询 TTS 记录的响应
export interface TtsRecordsQueryResponse {
  records: TtsRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 用于前端显示的生成记录格式（兼容现有组件）
export interface Generation {
  id: string;
  text: string;
  timestamp: string;
  duration: number;
  characterCount: number;
  audioUrl: string;
  status?: TaskStatus;
  errorMessage?: string;
  voiceName?: string;
  voiceDisplayName?: string; // 语音显示名称
  voiceAvatar?: string; // 语音头像 URL
}

// TTS 生成请求参数
export interface TtsGenerateRequest {
  text: string;
  voiceName: string;  // 语音名称，如 zh-CN-XiaoxiaoNeural
  language: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

// TTS 生成响应 - 任务状态
export interface TtsTaskStatus {
  task_id: string;
  status: TaskStatus;
  progress: number;
  result?: {
    audio_url: string;
    duration: number;
    format: string;
    task_id: string;
    user_id: string;
    record_id: string;
    credits_cost: number;
  };
  error?: string;
}