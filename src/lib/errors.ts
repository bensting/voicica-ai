/**
 * 应用错误处理系统
 *
 * 提供统一的错误类型定义和处理机制
 * - 类型安全的错误定义
 * - 支持国际化的错误码
 * - 携带额外的错误数据
 */

/**
 * 应用基础错误类
 *
 * 所有业务错误都应该继承此类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public data?: Record<string, unknown>,
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ============================================
// 认证相关错误
// ============================================

/**
 * 未登录错误
 */
export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', '未登录', undefined, 401);
  }
}

/**
 * 未提供认证信息错误
 */
export class NoAuthInfoError extends AppError {
  constructor() {
    super('NO_AUTH_INFO', '未提供认证信息', undefined, 401);
  }
}

// ============================================
// 积分相关错误
// ============================================

/**
 * 积分不足错误
 */
export class InsufficientCreditsError extends AppError {
  constructor(required: number, current: number) {
    super(
      'INSUFFICIENT_CREDITS',
      `积分不足。需要 ${required}，当前 ${current}`,
      { required, current },
      400
    );
  }
}

// ============================================
// 任务相关错误
// ============================================

/**
 * 任务不存在错误
 */
export class TaskNotFoundError extends AppError {
  constructor(taskId: string) {
    super('TASK_NOT_FOUND', `任务不存在: ${taskId}`, { taskId }, 404);
  }
}

/**
 * 任务创建失败错误
 */
export class TaskCreationError extends AppError {
  constructor(reason?: string) {
    super(
      'TASK_CREATION_FAILED',
      reason ? `任务创建失败: ${reason}` : '任务创建失败',
      { reason },
      500
    );
  }
}

// ============================================
// 验证相关错误
// ============================================

/**
 * 参数验证错误
 */
export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', `参数验证失败: ${field} - ${message}`, { field }, 400);
  }
}

/**
 * 文本过长错误
 */
export class TextTooLongError extends AppError {
  constructor(maxLength: number, currentLength: number) {
    super(
      'TEXT_TOO_LONG',
      `文本过长。最大长度 ${maxLength}，当前长度 ${currentLength}`,
      { maxLength, currentLength },
      400
    );
  }
}

// ============================================
// 资源相关错误
// ============================================

/**
 * 资源不存在错误
 */
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('RESOURCE_NOT_FOUND', `${resource}不存在: ${id}`, { resource, id }, 404);
  }
}

/**
 * 语音模型不存在错误
 */
export class VoiceNotFoundError extends AppError {
  constructor(voiceName: string) {
    super('VOICE_NOT_FOUND', `语音模型不存在: ${voiceName}`, { voiceName }, 404);
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 将错误转换为响应格式
 *
 * 用于 Server Actions 统一错误处理
 */
export function errorToResponse(error: unknown): {
  errorCode: string;
  error: string;
  errorData?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      errorCode: error.code,
      error: error.message,
      errorData: error.data,
    };
  }

  // 未知错误
  console.error('❌ Unexpected error:', error);
  return {
    errorCode: 'INTERNAL_ERROR',
    error: '服务器内部错误',
  };
}

/**
 * 判断是否为应用错误
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}