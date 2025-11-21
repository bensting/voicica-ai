/**
 * 配置相关类型定义
 */

/**
 * 语言选项
 */
export interface LocaleOption {
  /** 语言代码 (如: zh-CN, en-US) */
  code: string;
  /** 显示名称 */
  name: string;
  /** ISO 3166-1 alpha-2 国家代码 (如: CN, US) */
  countryCode: string;
}