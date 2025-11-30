'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { FAQ_ITEMS } from '@/config/faqConfig';
import FAQAccordion from './FAQAccordion';

/**
 * FAQ Section Component
 *
 * Dark-themed FAQ section with accordion-style questions
 */
export default function FAQ() {
  const { t } = useLanguage();

  return (
    <section id="faq" className="py-12 sm:py-16 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-gray-400 text-lg">
            {t('faq.description')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <FAQAccordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}