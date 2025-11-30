'use client';

import {
  WelcomeBanner,
  FeaturedProductsSection,
  ToolsSuggestionSection,
} from '@/components/features/studio/home';

export default function StudioPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <WelcomeBanner />
      <FeaturedProductsSection />
      <ToolsSuggestionSection />
    </div>
  );
}