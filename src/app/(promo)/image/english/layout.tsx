import type { Metadata } from 'next';

// English AI Image Generator Landing Page - SEO optimized metadata
// Free AI Image Generator - Voicica AI

export const metadata: Metadata = {
  title: 'Free AI Image Generator | Text to Image Online - Voicica AI',
  description: 'Free AI image generator - create stunning images from text instantly. No sign up required. Generate art, photos, illustrations with AI. Unlimited use, free forever.',
  keywords: [
    'AI image generator',
    'AI image generator free',
    'text to image',
    'text to image AI',
    'AI art generator',
    'free image generator',
    'AI picture generator',
    'text to image free',
    'AI image creator',
    'generate images from text',
    'AI art free',
    'voicica',
    'image AI',
    'free AI art',
  ],
  openGraph: {
    title: 'Free AI Image Generator | Voicica AI',
    description: 'Create stunning AI images from text instantly. No sign up required. Free forever.',
    url: 'https://voicica.ai/image/english',
    siteName: 'Voicica AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image-english.png',
        width: 1200,
        height: 630,
        alt: 'Voicica AI - Free AI Image Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Image Generator | Voicica AI',
    description: 'Create stunning AI images from text instantly. No sign up required.',
    images: ['/images/og-image-english.png'],
  },
  alternates: {
    canonical: 'https://voicica.ai/image/english',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
