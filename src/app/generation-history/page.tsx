'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import GenerationHistory from '@/components/features/generation-history/GenerationHistory';

export default function GenerationHistoryPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const [generations, setGenerations] = useState([
    {
      id: '1',
      text: '我是太乙真人,拿你的狗头来。',
      timestamp: 'Just now',
      duration: 4,
      characterCount: 14,
      audioUrl: '/audio/sample1.mp3'
    },
    {
      id: '2',
      text: '发生的发大水',
      timestamp: '3 days ago',
      duration: 4,
      characterCount: 6,
      audioUrl: '/audio/sample2.mp3'
    }
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClearAll = () => {
    setGenerations([]);
  };

  const handleDeleteGeneration = (id: string) => {
    setGenerations(prev => prev.filter(gen => gen.id !== id));
  };

  const handleDownloadGeneration = (id: string) => {
    // TODO: Implement download functionality
    console.log('Downloading generation:', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GenerationHistory
          generations={generations}
          onClearAll={handleClearAll}
          onDeleteGeneration={handleDeleteGeneration}
          onDownloadGeneration={handleDownloadGeneration}
        />
      </div>
    </div>
  );
}
