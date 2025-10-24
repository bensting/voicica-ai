import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from '@/lib/firebase';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';

/**
 * API 客户端配置
 *
 * 特点：
 * 1. 自动添加 Firebase ID Token 到请求头（已登录用户）
 * 2. 自动添加设备指纹到请求头（匿名用户）
 * 3. 统一错误处理
 * 4. 请求/响应拦截器
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
    // 请求拦截器：自动添加认证信息
    this.client.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;

        if (user) {
          // 已登录用户：添加 Authorization token
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 已登录用户请求，使用 Authorization token');
        } else {
          // 匿名用户：添加设备指纹
          try {
            const fingerprint = await getDeviceFingerprint();
            config.headers['X-Device-Fingerprint'] = fingerprint;
            console.log('📱 匿名用户请求，使用设备指纹:', fingerprint.substring(0, 16) + '...');
          } catch (error) {
            console.error('❌ 获取设备指纹失败:', error);
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：统一错误处理
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ [API Response]', {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        if (error.response) {
          // 服务器返回错误
          const { status, data } = error.response;

          console.error('❌ [API Error] Server returned error:', {
            status,
            url: error.config?.url,
            method: error.config?.method,
            requestData: error.config?.data,
            responseData: data,
          });

          if (status === 401) {
            // 未授权：检查是否为已登录用户的 token 过期
            const user = auth.currentUser;
            if (user) {
              // 已登录用户的 token 过期，清除登录状态并跳转到登录页
              console.error('🔑 Token 已过期，跳转到登录页');
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            } else {
              // 匿名用户收到 401，可能是设备指纹问题，不跳转登录页
              console.warn('📱 匿名用户认证失败（可能是设备指纹问题）');
            }
          }
        } else if (error.request) {
          // 请求已发出但未收到响应
          console.error('❌ [API Error] Network error - no response received:', {
            url: error.config?.url,
            method: error.config?.method,
            request: error.request,
          });
        } else {
          // 其他错误
          console.error('❌ [API Error] Request setup error:', error.message);
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