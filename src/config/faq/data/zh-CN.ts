/**
 * FAQ - 简体中文
 */

import { FAQData } from '../types';

export const faqData: FAQData = {
  title: '关于 AI 语音实验室的常见问题',
  description: '查找有关我们 AI 语音生成平台的常见问题解答。',
  items: [
    {
      id: 'freeTrial',
      question: '有免费试用吗？',
      answer: '有的！如果您使用电子邮件地址或手机号码注册，就可以使用免费试用！',
    },
    {
      id: 'refunds',
      question: '退款如何运作？',
      answer:
        '我们为首次订阅用户提供 7 天退款保证。有关退款和取消的详细信息，请参阅我们的退款政策。',
    },
    {
      id: 'studentDiscounts',
      question: '你们提供学生折扣吗？',
      answer:
        '是的，我们为学生和教育机构提供特别定价。请携带有效的学生证或机构邮箱联系我们的支持团队以获取更多信息。',
    },
    {
      id: 'outOfCredit',
      question: '如果我用完了额度会怎样？',
      answer:
        '如果您用完了当前套餐的额度，您可以升级到更高级别的套餐或购买额外的额度。您的账户将保持活跃状态，但在添加更多额度之前，您将无法生成新的语音。',
    },
    {
      id: 'billingOptions',
      question: '你们有按月和按年的计费选项吗？',
      answer:
        '是的，我们提供月度和年度订阅计划。与月度计费相比，年度计划享有大幅折扣。您可以随时切换计费周期。',
    },
    {
      id: 'changePlans',
      question: '当我更改套餐时会发生什么？',
      answer:
        '升级时，更改会立即生效，您将被收取按比例计算的差额。降级时，更改将在当前计费周期结束时生效，在此之前您将保留对当前套餐功能的访问权限。',
    },
    {
      id: 'cancelPlan',
      question: '如何取消我的付费套餐？',
      answer:
        '您可以随时从账户设置中取消订阅。您的订阅将在当前计费周期结束前保持活跃状态，之后将自动降级为免费套餐。',
    },
  ],
};