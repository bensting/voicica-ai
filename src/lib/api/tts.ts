import axios from 'axios';
import { getAuth } from 'firebase/auth';
import {
  TtsRecordsQueryParams,
  TtsRecordsQueryResponse,
  TtsRecord,
  Generation,
  TaskStatus
} from '@/types/tts';

// API 基础 URL - 从环境变量读取
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 获取认证 token
 */
async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return await user.getIdToken();
}

/**
 * 查询 TTS 记录
 */
export async function queryTtsRecords(
  params: TtsRecordsQueryParams = {}
): Promise<TtsRecordsQueryResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await axios.get(`${API_BASE_URL}/api/v1/tts/records/query`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        status: params.status,
        start_date: params.start_date,
        end_date: params.end_date,
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error querying TTS records:', error);
    throw error;
  }
}

/**
 * 删除 TTS 记录
 */
export async function deleteTtsRecord(recordId: string): Promise<void> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    await axios.delete(`${API_BASE_URL}/api/v1/tts/records/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting TTS record:', error);
    throw error;
  }
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
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(`${API_BASE_URL}/api/v1/tts/records/batch-delete`, {
      record_ids: recordIds || null,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error batch deleting TTS records:', error);
    throw error;
  }
}

/**
 * 下载音频文件
 */
export async function downloadAudio(audioUrl: string, filename: string): Promise<void> {
  try {
    const response = await axios.get(audioUrl, {
      responseType: 'blob',
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
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
    errorMessage: record.error_message,
    voiceName: record.voice_name,
  };
}

/**
 * 格式化时间戳为相对时间
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
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