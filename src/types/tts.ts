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
  progress?: number; // 任务进度 0-100
  duration?: number;
  character_count: number;
  audio_url?: string;
  error_message?: string;
  voice_id?: string;
  voice_name?: string;
  voice?: {
    id: string;
    name: string;
    display_name: string;
    avatar_url: string;
    [key: string]: unknown;
  }; // 关联的语音信息（仅在查询时填充）
}

// 查询 TTS 记录的请求参数
export interface TtsRecordsQueryParams {
  status?: TaskStatus | TaskStatus[];  // 支持单个状态或多个状态数组
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
  progress?: number; // 任务进度 0-100 (用于 processing 状态)
  errorMessage?: string;
  voiceName?: string;
  voiceDisplayName?: string; // 语音显示名称
  voiceAvatar?: string; // 语音头像 URL
  style?: string | null; // 语音风格
  shareId?: string | null; // 分享短码
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

// 工具函数

/**
 * 获取状态的显示文本
 */
export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    [TaskStatus.PENDING]: 'Pending',
    [TaskStatus.PROCESSING]: 'Processing',
    [TaskStatus.SUCCESS]: 'Success',
    [TaskStatus.FAILURE]: 'Failed',
  };
  return labels[status] || status;
}

/**
 * 获取状态的颜色样式
 */
export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TaskStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [TaskStatus.SUCCESS]: 'bg-green-100 text-green-800',
    [TaskStatus.FAILURE]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}