/**
 * FAQ 配置类型定义
 */

/**
 * 单个 FAQ 问答
 */
export interface FAQItem {
  /** 唯一标识 */
  id: string;
  /** 问题 */
  question: string;
  /** 答案 */
  answer: string;
}

/**
 * FAQ 数据结构
 */
export interface FAQData {
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 问答列表 */
  items: FAQItem[];
}