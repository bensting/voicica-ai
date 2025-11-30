'use client';

import { useState } from 'react';
import { ChevronDown, Minus } from 'lucide-react';
import type { FAQItem } from '@/config/faq';

interface FAQAccordionProps {
  items: FAQItem[];
}

/**
 * FAQ Accordion Component
 *
 * Displays a list of FAQ items with expand/collapse functionality
 */
export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden transition-all hover:border-purple-500/50"
        >
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
            aria-expanded={openIndex === index}
          >
            <div className="flex items-start gap-4 flex-1">
              <span className="text-purple-400 font-bold text-lg flex-shrink-0">
                {index + 1}.
              </span>
              <span className={`font-medium text-base md:text-lg transition-colors ${
                openIndex === index ? 'text-purple-400' : 'text-white group-hover:text-purple-300'
              }`}>
                {item.question}
              </span>
            </div>
            <div className="flex-shrink-0 ml-4">
              {openIndex === index ? (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Minus className="w-5 h-5 text-purple-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
              )}
            </div>
          </button>

          {/* Answer with smooth animation */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              openIndex === index
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6 pl-16 md:pl-20">
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}