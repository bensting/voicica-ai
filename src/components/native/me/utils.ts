/**
 * MyCreations 共享工具函数
 */

// 格式化日期 (短格式)
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 格式化日期 (长格式，用于分组标题)
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// 格式化时间 (秒 -> mm:ss)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 获取模型显示名称
export function getModelDisplayName(model: string): string {
  const modelMap: Record<string, string> = {
    'music-5.0': 'v5.0',
    'music-4.5-plus': 'v4.5+',
    'music-4.5': 'v4.5',
  };
  return modelMap[model] || model;
}
