'use client';

import { useEffect, useCallback } from 'react';
import { getDialogueTaskStatus, type DialogueRecord } from '@/actions/dialogue';

/**
 * Dialogue 任务轮询 Hook
 *
 * 功能：
 * - 自动轮询处理中的 Dialogue 任务状态
 * - 直接查询 KIE API 获取最新状态
 * - 超时处理：任务创建超过 30 分钟后停止轮询
 * - 支持回调更新状态
 */

interface UseDialogueTaskPollingOptions {
  /** Dialogue 记录列表 */
  records: DialogueRecord[];
  /** 是否启用轮询 */
  enabled?: boolean;
  /** 轮询间隔（毫秒），默认 5000 */
  interval?: number;
  /** 状态更新回调 */
  onStatusUpdate: (taskId: string, status: Awaited<ReturnType<typeof getDialogueTaskStatus>>) => void;
}

/**
 * 检查任务是否在超时时间内（30分钟）
 */
function isWithinTimeout(createdAt: Date | string): boolean {
  const taskAgeMinutes = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60;
  return taskAgeMinutes < 30;
}

export function useDialogueTaskPolling({
  records,
  enabled = true,
  interval = 5000,
  onStatusUpdate,
}: UseDialogueTaskPollingOptions) {

  const pollTasks = useCallback(async () => {
    // 筛选需要轮询的任务：处理中且未超时
    const processingRecords = records.filter(
      (d) =>
        (d.status === 'PENDING' || d.status === 'PROCESSING') &&
        isWithinTimeout(d.created_at)
    );

    if (processingRecords.length === 0) return;

    console.log(`💬 [useDialogueTaskPolling] 轮询 ${processingRecords.length} 个处理中的任务`);

    // 并行查询所有处理中的任务状态
    await Promise.all(
      processingRecords.map(async (record) => {
        try {
          const status = await getDialogueTaskStatus(record.task_id);
          onStatusUpdate(record.task_id, status);
        } catch (error) {
          console.error(`💬 [useDialogueTaskPolling] 查询任务状态失败: ${record.task_id}`, error);
        }
      })
    );
  }, [records, onStatusUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // 检查是否有需要轮询的任务
    const hasProcessingTasks = records.some(
      (d) =>
        (d.status === 'PENDING' || d.status === 'PROCESSING') &&
        isWithinTimeout(d.created_at)
    );

    if (!hasProcessingTasks) return;

    const pollInterval = setInterval(() => {
      void pollTasks();
    }, interval);

    return () => clearInterval(pollInterval);
  }, [enabled, records, interval, pollTasks]);

  return { pollTasks };
}
