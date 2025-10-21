'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Define FAQ questions keys
  const faqQuestions = [
    'freeTrial',
    'refunds',
    'studentDiscounts',
    'outOfCredit',
    'billingOptions',
    'changePlans',
    'cancelPlan',
  ];

  return (
    <section id="faq" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left side - Title and description */}
          <div className="lg:pr-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('faq.title')}
              <br />
              {t('faq.titleLine2')}
            </h2>
            <p className="text-gray-600 text-base md:text-lg mb-8">
              {t('faq.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/help"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('faq.helpCenter')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
              >
                {t('faq.contact')}
              </Link>
            </div>
          </div>

          {/* Right side - FAQ accordion */}
          <div className="space-y-4">
            {faqQuestions.map((questionKey, index) => (
              <div
                key={questionKey}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className={`font-medium text-base md:text-lg ${
                    openIndex === index ? 'text-purple-600' : 'text-gray-900'
                  }`}>
                    {t(`faq.questions.${questionKey}.question`)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      {t(`faq.questions.${questionKey}.answer`)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}