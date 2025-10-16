import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from '@/lib/firebase';

/**
 * API 客户端配置
 *
 * 特点：
 * 1. 自动添加 Firebase ID Token 到请求头
 * 2. 统一错误处理
 * 3. 请求/响应拦截器
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器：自动添加认证 Token
    this.client.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // 服务器返回错误
          const { status, data } = error.response;

          if (status === 401) {
            // 未授权：清除登录状态并跳转到登录页
            console.error('Unauthorized - redirecting to login');
            // 可以触发全局事件或使用路由跳转
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }

          console.error('API Error:', data);
        } else if (error.request) {
          // 请求已发出但未收到响应
          console.error('Network Error:', error.request);
        } else {
          // 其他错误
          console.error('Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // 封装常用HTTP方法
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

// 导出单例
export const apiClient = new APIClient();

/**
 * API 服务层
 * 按功能模块组织API调用
 */

// 用户相关 API
export const userAPI = {
  // 获取当前用户资料
  getCurrentUser: () => {
    return apiClient.get('/api/v1/users/me');
  },

  // 更新用户资料
  updateProfile: (data: { name?: string; photo_url?: string }) => {
    return apiClient.put('/api/v1/users/me', data);
  },

  // 获取用户积分
  getCredits: () => {
    return apiClient.get('/api/v1/users/me/credits');
  },
};

// 语音相关 API（示例）
export const voiceAPI = {
  // 获取语音列表
  getVoices: () => {
    return apiClient.get('/api/v1/voices');
  },

  // 创建语音模型
  createVoice: (data: unknown) => {
    return apiClient.post('/api/v1/voices', data);
  },
};

// 订阅相关 API（示例）
export const subscriptionAPI = {
  // 获取订阅信息
  getSubscription: () => {
    return apiClient.get('/api/v1/subscriptions/me');
  },

  // 创建订阅
  createSubscription: (data: unknown) => {
    return apiClient.post('/api/v1/subscriptions', data);
  },
};