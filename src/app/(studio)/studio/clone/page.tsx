'use client';

import { useEffect } from 'react';
import { useStudio } from '@/contexts/StudioContext';
import PageHeader from '@/components/features/studio/clone/components/PageHeader';
import CloneModesSection from '@/components/features/studio/clone/CloneModesSection';
import MyVoicesSection from '@/components/features/studio/clone/MyVoicesSection';

/**
 * Voice Cloning Page
 *
 * Features:
 * - Clone Mode: Upload video/audio files
 * - Custom Parameter Cloning: Create unique characters
 * - My Voices: List of cloned voices
 */
export default function ClonePage() {
  const { setTitle } = useStudio();

  useEffect(() => {
    setTitle('AI Voice Cloning');
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 移动端需要留出底部导航栏的空间 */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20 lg:py-12 lg:pb-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <PageHeader
            title="AI Voice Cloning:"
            subtitle="Create Realistic Voices in Seconds"
            description="Try AI voice cloning online for free — clone your own voice naturally in multiple languages."
          />
        </div>

        {/* Clone Modes Section */}
        <CloneModesSection />

        {/* My Voices Section */}
        <MyVoicesSection />
      </div>
    </div>
  );
}