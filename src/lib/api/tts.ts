import { apiClient } from './client';
import {
  TtsRecordsQueryParams,
  TtsRecordsQueryResponse,
  TtsRecord,
  Generation,
  TaskStatus,
  TtsGenerateRequest,
  TtsTaskStatus
} from '@/types/tts';

/**
 * 生成 TTS 语音（异步任务）
 *
 * 支持正式用户和匿名用户
 * - 正式用户：自动通过 Authorization header 传递 token
 * - 匿名用户：需要通过 X-Device-Fingerprint header 传递设备指纹
 *
 * 返回：
 * - task_id: 任务ID，用于查询进度
 * - status: 初始状态为 pending
 * - progress: 0
 */
export async function generateTTS(
  request: TtsGenerateRequest
): Promise<TtsTaskStatus> {
  return apiClient.post<TtsTaskStatus>('/api/v1/tts/generate', {
    text: request.text,
    voiceName: request.voiceName,  // 使用 camelCase，后端有 alias 支持
    language: request.language,
    speed: request.speed,
    pitch: request.pitch,
    volume: request.volume,
  });
}

/**
 * 查询 TTS 任务状态
 *
 * 支持正式用户和匿名用户
 * - 正式用户：自动通过 Authorization header 传递 token
 * - 匿名用户：需要通过 X-Device-Fingerprint header 传递设备指纹
 *
 * 返回：
 * - task_id: 任务ID
 * - status: 任务状态（pending/processing/success/failure）
 * - progress: 进度（0-100）
 * - result: 成功时的结果（包含 audio_url 等）
 * - error: 失败时的错误信息
 */
export async function getTaskStatus(taskId: string): Promise<TtsTaskStatus> {
  return apiClient.get<TtsTaskStatus>(`/api/v1/tts/task/${taskId}`);
}

/**
 * 查询 TTS 记录
 */
export async function queryTtsRecords(
  params: TtsRecordsQueryParams = {}
): Promise<TtsRecordsQueryResponse> {
  return apiClient.get<TtsRecordsQueryResponse>('/api/v1/tts/records/query', {
    params: {
      status: params.status,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page || 1,
      page_size: params.page_size || 20,
    },
  });
}

/**
 * 根据记录 ID 获取单条 TTS 记录
 */
export async function getTtsRecordById(recordId: string): Promise<TtsRecord> {
  return apiClient.get<TtsRecord>(`/api/v1/tts/records/${recordId}`);
}

/**
 * 根据任务 ID 获取 TTS 记录
 */
export async function getTtsRecordByTaskId(taskId: string): Promise<TtsRecord> {
  return apiClient.get<TtsRecord>(`/api/v1/tts/records/task/${taskId}`);
}

/**
 * 删除 TTS 记录
 */
export async function deleteTtsRecord(recordId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/tts/records/${recordId}`);
}

/**
 * 批量删除 TTS 记录
 * @param recordIds - 要删除的记录ID列表，为空数组或null时删除所有记录
 */
export async function batchDeleteTtsRecords(recordIds?: string[] | null): Promise<{
  message: string;
  total: number;
  deleted: number;
  failed: number;
}> {
  return apiClient.post('/api/v1/tts/records/batch-delete', {
    record_ids: recordIds || null,
  });
}

/**
 * 下载音频文件
 */
export async function downloadAudio(audioUrl: string, filename: string): Promise<void> {
  try {
    // Note: Direct file download doesn't need authentication
    const response = await fetch(audioUrl);
    const blob = await response.blob();

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw error;
  }
}

/**
 * 将后端返回的 TtsRecord 转换为前端 Generation 格式
 */
export function convertTtsRecordToGeneration(record: TtsRecord): Generation {
  return {
    id: record.id,
    text: record.text,
    timestamp: formatTimestamp(record.created_at),
    duration: record.duration || 0,
    characterCount: record.character_count,
    audioUrl: record.audio_url || '',
    status: record.status,
    progress: record.progress,
    errorMessage: record.error_message,
    // 优先使用 voice 对象中的名称，回退到 voice_name
    voiceName: record.voice?.name || record.voice_name,
    // 提取 voice 对象中的多语言显示名称
    voiceDisplayName: record.voice?.display_name,
    // 提取 voice 对象中的头像 URL
    voiceAvatar: record.voice?.avatar_url,
  };
}

/**
 * 格式化时间戳为具体日期时间
 * 格式: YYYY-MM-DD HH:mm
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

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