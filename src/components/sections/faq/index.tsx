'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getFAQData } from '@/config/faq';
import FAQAccordion from './FAQAccordion';

/**
 * FAQ Section Component
 *
 * Dark-themed FAQ section with accordion-style questions
 * 内容从 config/faq 读取
 */
export default function FAQ() {
  const { locale } = useLanguage();
  const faqData = getFAQData(locale);

  return (
    <section id="faq" className="py-12 sm:py-16 px-4 bg-gradient-to-b from-rose-50 via-white to-pink-50">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {faqData.title}
          </h2>
          <p className="text-gray-600 text-lg">
            {faqData.description}
          </p>
        </div>

        {/* FAQ Accordion */}
        <FAQAccordion items={faqData.items} />
      </div>
    </section>
  );
}