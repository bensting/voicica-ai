/**
 * FAQ - English
 *
 * 格式: [id, question, answer]
 * 一行一个问答，更易于编辑
 */

import { FAQData } from '../types';

// 问答列表 - 每行一个 [id, 问题, 答案]
const items: [string, string, string][] = [
  [
    'freeTrial',
    'Is there a free trial?',
    'Yes, you can use the free trial if you sign up with your email address or phone number!',
  ],
  [
    'refunds',
    'How do refunds work?',
    'We offer a 7-day money-back guarantee for first-time subscribers. Please refer to our Refund Policy for detailed information about refunds and cancellations.',
  ],
  [
    'studentDiscounts',
    'Do you offer student discounts?',
    'Yes, we offer special pricing for students and educational institutions. Please contact our support team with your valid student ID or institutional email for more information.',
  ],
  [
    'outOfCredit',
    'What happens if I run out of credit?',
    "If you run out of credit on your current plan, you can either upgrade to a higher tier plan or purchase additional credits. Your account will remain active, but you won't be able to generate new voices until you add more credits.",
  ],
  [
    'billingOptions',
    'Do you have monthly and yearly billing options?',
    'Yes, we offer both monthly and annual subscription plans. Annual plans come with a significant discount compared to monthly billing. You can switch between billing cycles at any time.',
  ],
  [
    'changePlans',
    'What happens when I change plans?',
    "When upgrading, the change takes effect immediately and you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing period, and you'll retain access to your current plan features until then.",
  ],
  [
    'cancelPlan',
    'How do I cancel my paid plan?',
    "You can cancel your subscription anytime from your account settings. Your subscription will remain active until the end of the current billing period, and you'll automatically be downgraded to the free plan afterward.",
  ],
];

export const faqData: FAQData = {
  title: 'Frequently Asked Questions about Voicica AI',
  description: 'Find answers to common questions about our AI voice generation platform.',
  items: items.map(([id, question, answer]) => ({ id, question, answer })),
};