/**
 * FAQ - 繁體中文
 */

import { FAQData } from '../types';

export const faqData: FAQData = {
  title: '關於 AI 語音實驗室的常見問題',
  description: '查找有關我們 AI 語音生成平台的常見問題解答。',
  items: [
    {
      id: 'freeTrial',
      question: '有免費試用嗎？',
      answer: '有的！如果您使用電子郵件地址或手機號碼註冊，就可以使用免費試用！',
    },
    {
      id: 'refunds',
      question: '退款如何運作？',
      answer:
        '我們為首次訂閱用戶提供 7 天退款保證。有關退款和取消的詳細資訊，請參閱我們的退款政策。',
    },
    {
      id: 'studentDiscounts',
      question: '你們提供學生折扣嗎？',
      answer:
        '是的，我們為學生和教育機構提供特別定價。請攜帶有效的學生證或機構郵箱聯絡我們的支援團隊以獲取更多資訊。',
    },
    {
      id: 'outOfCredit',
      question: '如果我用完了額度會怎樣？',
      answer:
        '如果您用完了當前套餐的額度，您可以升級到更高級別的套餐或購買額外的額度。您的帳戶將保持活躍狀態，但在添加更多額度之前，您將無法生成新的語音。',
    },
    {
      id: 'billingOptions',
      question: '你們有按月和按年的計費選項嗎？',
      answer:
        '是的，我們提供月度和年度訂閱計劃。與月度計費相比，年度計劃享有大幅折扣。您可以隨時切換計費週期。',
    },
    {
      id: 'changePlans',
      question: '當我更改套餐時會發生什麼？',
      answer:
        '升級時，更改會立即生效，您將被收取按比例計算的差額。降級時，更改將在當前計費週期結束時生效，在此之前您將保留對當前套餐功能的訪問權限。',
    },
    {
      id: 'cancelPlan',
      question: '如何取消我的付費套餐？',
      answer:
        '您可以隨時從帳戶設定中取消訂閱。您的訂閱將在當前計費週期結束前保持活躍狀態，之後將自動降級為免費套餐。',
    },
  ],
};