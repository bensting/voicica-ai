'use client';

import { useState } from 'react';

interface SampleTextListProps {
  texts: string[];
  title?: string;
}

/**
 * Sample Text List Component
 *
 * Displays a list of sample texts that can be expanded/collapsed
 * Used in AudioRecorder to show example texts for voice recording
 */
export default function SampleTextList({
  texts,
  title = 'You can say this',
}: SampleTextListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>
      <div className="space-y-2">
        {texts.map((text, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <button
              key={index}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
                isExpanded
                  ? 'bg-purple-50 hover:bg-purple-100 border-purple-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <p className={`text-sm text-gray-700 flex-1 text-left transition-all duration-200 ${
                isExpanded ? '' : 'line-clamp-1'
              }`}>
                {text}
              </p>
              <svg
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 mt-0.5 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}