export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Voicica AI',
        url: 'https://voicica.ai',
      },
      {
        '@type': 'Organization',
        name: 'Voicica AI',
        url: 'https://voicica.ai',
        logo: 'https://voicica.ai/icons/icon-512x512.png',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Voicica AI',
        url: 'https://voicica.ai',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'AI Text to Speech with 3200+ voices',
          'AI Music Generator',
          'AI Image Creator',
          'Free Video Downloader',
          'HD Image Upscaler',
          'Background Remover',
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
