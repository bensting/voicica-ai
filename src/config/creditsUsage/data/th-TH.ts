/**
 * คู่มือการใช้เครดิต - ภาษาไทย
 */

import { CreditsUsageData } from '../types';
import { ProductCategory } from '../../productCategory';

export const creditsUsageData: CreditsUsageData = {
  categories: [
    {
      id: ProductCategory.AI_VOICE,
      name: 'การสร้างเสียง AI',
      features: [
        {
          name: 'ข้อความเป็นเสียง',
          cost: '1/100 ตัวอักษร',
          description:
            '1 เครดิตจะถูกใช้สำหรับทุกๆ 100 ตัวอักษร น้อยกว่า 100 ตัวอักษรก็ใช้ 1 เครดิต ตัวอย่างเช่น ถ้ามี 101 ตัวอักษร จะใช้ 2 เครดิต และอื่นๆ',
        },
        {
          name: 'เสียงเป็นเสียง',
          cost: '10/นาที',
        },
        {
          name: 'โคลนเสียง',
          cost: '100/เสียง',
        },
      ],
    },
    {
      id: ProductCategory.AI_MUSIC,
      name: 'การสร้างเพลง AI',
      features: [
        {
          name: 'เพลง AI',
          cost: '50/เพลง',
        },
        {
          name: 'คัฟเวอร์ AI',
          cost: '30/เพลง',
        },
      ],
    },
    {
      id: ProductCategory.AI_VIDEO,
      name: 'การสร้างวิดีโอ AI',
      features: [
        {
          name: 'เครื่องมือสร้างวิดีโอ AI',
          cost: '100/วิดีโอ',
        },
        {
          name: 'เอฟเฟกต์วิดีโอ',
          cost: '25/ครั้ง',
        },
      ],
    },
  ],
};