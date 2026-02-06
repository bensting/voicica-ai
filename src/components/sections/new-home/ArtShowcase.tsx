'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';
import ImageLightbox from './ImageLightbox';

export default function ArtShowcase() {
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    prompt?: string;
  } | null>(null);

  const { artworks } = HOME_SHOWCASE_CONFIG;

  return (
    <>
      {/* Vertical stack of circular AI Art images */}
      <div className="flex flex-col gap-2">
        {artworks.map((artwork) => (
          <button
            key={artwork.id}
            onClick={() =>
              setLightboxImage({ src: artwork.src, alt: artwork.alt, prompt: artwork.prompt })
            }
            className="group relative h-14 w-14 overflow-hidden rounded-full border-2 border-purple-500/50 transition-all hover:scale-110 hover:border-purple-400"
          >
            <Image
              src={artwork.src}
              alt={artwork.alt}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="56px"
            />
            {/* Gradient ring effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          prompt={lightboxImage.prompt}
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
