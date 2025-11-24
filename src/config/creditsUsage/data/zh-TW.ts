/**
 * 積分使用指南 - 繁體中文
 */

import { CreditsUsageData } from '../types';
import { ProductCategory } from '../../productCategory';

export const creditsUsageData: CreditsUsageData = {
  categories: [
    {
      id: ProductCategory.AI_VOICE,
      name: 'AI 語音生成',
      features: [
        {
          name: '文字轉語音',
          cost: '1/100字元',
          description:
            '每100個字元消耗1積分，不足100字元也消耗1積分。例如，101個字元將消耗2積分，以此類推。',
        },
        {
          name: '語音轉語音',
          cost: '10/分鐘',
        },
        {
          name: '語音複製',
          cost: '100/個',
        },
      ],
    },
    {
      id: ProductCategory.AI_MUSIC,
      name: 'AI 音樂生成',
      features: [
        {
          name: 'AI 音樂',
          cost: '50/首',
        },
        {
          name: 'AI 翻唱',
          cost: '30/首',
        },
      ],
    },
    {
      id: ProductCategory.AI_VIDEO,
      name: 'AI 影片生成',
      features: [
        {
          name: 'AI 影片產生器',
          cost: '100/個',
        },
        {
          name: '影片特效',
          cost: '25/次',
        },
      ],
    },
  ],
};