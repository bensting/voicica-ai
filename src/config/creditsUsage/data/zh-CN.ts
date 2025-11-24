/**
 * 积分使用指南 - 简体中文
 */

import { CreditsUsageData } from '../types';
import { ProductCategory } from '../../productCategory';

export const creditsUsageData: CreditsUsageData = {
  categories: [
    {
      id: ProductCategory.AI_VOICE,
      name: 'AI 语音生成',
      features: [
        {
          name: '文字转语音',
          cost: '1/100字符',
          description:
            '每100个字符消耗1积分，不足100字符也消耗1积分。例如，101个字符将消耗2积分，以此类推。',
        },
        {
          name: '语音转语音',
          cost: '10/分钟',
        },
        {
          name: '语音克隆',
          cost: '100/个',
        },
      ],
    },
    {
      id: ProductCategory.AI_MUSIC,
      name: 'AI 音乐生成',
      features: [
        {
          name: 'AI 音乐',
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
      name: 'AI 视频生成',
      features: [
        {
          name: 'AI 视频生成器',
          cost: '100/个',
        },
        {
          name: '视频特效',
          cost: '25/次',
        },
      ],
    },
  ],
};