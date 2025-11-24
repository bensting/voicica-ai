/**
 * Credits Usage Guide - English
 */

import { CreditsUsageData } from '../types';
import { ProductCategory } from '../../productCategory';

export const creditsUsageData: CreditsUsageData = {
  categories: [
    {
      id: ProductCategory.AI_VOICE,
      name: 'AI Voice Generation',
      features: [
        {
          name: 'Text to Speech',
          cost: '1/100 chars',
          description:
            '1 credit is consumed for every 100 characters. Less than 100 characters will still consume 1 credit. For example, if the character count is 101, then 2 credits will be consumed, and so on.',
        },
        {
          name: 'Speech to Speech',
          cost: '10/min',
        },
        {
          name: 'Voice Cloning',
          cost: '100/voice',
        },
      ],
    },
    {
      id: ProductCategory.AI_MUSIC,
      name: 'AI Music Generation',
      features: [
        {
          name: 'AI Music',
          cost: '50/song',
        },
        {
          name: 'AI Cover',
          cost: '30/song',
        },
      ],
    },
    {
      id: ProductCategory.AI_VIDEO,
      name: 'AI Video Generation',
      features: [
        {
          name: 'AI Video Generator',
          cost: '100/video',
        },
        {
          name: 'Video Effects',
          cost: '25/time',
        },
      ],
    },
  ],
};