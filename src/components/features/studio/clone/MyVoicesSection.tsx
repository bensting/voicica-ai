'use client';

import { useState } from 'react';

/**
 * My Voices Section Component
 *
 * Displays user's cloned voices with empty state
 */
export default function MyVoicesSection() {
  const [clonedVoices] = useState<never[]>([]); // Empty for now

  const handleCreateFirstVoice = () => {
    console.log('Create first voice');
    // TODO: Navigate to clone mode or open modal
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">My Voices</h2>
      </div>

      {/* Empty State */}
      {clonedVoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 lg:py-16">
          {/* Empty folder illustration */}
          <div className="relative mb-6">
            <svg
              className="w-32 h-32 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg
                className="w-8 h-8 text-gray-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-6 text-center">
            You haven&apos;t cloned any voices yet. Create your first one now!
          </p>

          <button
            onClick={handleCreateFirstVoice}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 hover:shadow-xl"
          >
            Start
          </button>
        </div>
      ) : (
        // Voice list will go here when we have cloned voices
        <div className="space-y-3">
          {/* TODO: Render cloned voice cards */}
        </div>
      )}
    </div>
  );
}